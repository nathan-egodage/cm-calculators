const { DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const { AzureKeyCredential } = require("@azure/core-auth");
const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol } = require("@azure/storage-blob");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType, ImageRun } = require("docx");
const mammoth = require("mammoth");
const Busboy = require('busboy');
const libre = require('libreoffice-convert');
const util = require('util');
const convertAsync = util.promisify(libre.convert);
require('abort-controller/polyfill');
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { rgb } = require('pdf-lib');

// Helper function for text sanitization
function sanitizeText(text) {
    if (!text) return '';
    return text
        .replace(/[●•]/g, '*') // Replace bullets with asterisk
        .replace(/[""]/g, '"') // Replace smart quotes with straight quotes
        .replace(/['']/g, "'") // Replace smart apostrophes with straight apostrophes
        .replace(/[—–]/g, '-') // Replace em/en dashes with hyphen
        .replace(/[^\x00-\x7F]/g, '') // Remove other non-ASCII characters
        .trim();
}

module.exports = async function (context, req) {
    console.log('Function started');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body length:', req.body ? req.body.length : 0);
    
    try {
        // Log detailed request information
        context.log({
            message: 'CV Converter function processing request',
            headers: req.headers,
            contentType: req.headers['content-type'],
            bodyLength: req.body ? req.body.length : 0,
            method: req.method,
            url: req.url
        });

        // Validate environment variables
        const requiredEnvVars = [
            'FORM_RECOGNIZER_ENDPOINT',
            'FORM_RECOGNIZER_KEY',
            'AZURE_STORAGE_CONNECTION_STRING'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingEnvVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
        }

        // Validate content type
        if (!req.headers['content-type']?.includes('multipart/form-data')) {
            context.log.error('Invalid content type:', req.headers['content-type']);
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    error: 'Invalid content type. Expected multipart/form-data.',
                    details: req.headers['content-type']
                }
            };
            return;
        }

        // Initialize busboy
        const bb = Busboy({ headers: req.headers });
        let fileBuffer = null;
        let fileName = '';
        let positionTitle = '';
        let accountManagerId = '';
        let fileSize = 0;

        // Handle file data
        bb.on('file', (name, file, info) => {
            context.log(`Processing file: ${info.filename}, encoding: ${info.encoding}, mimeType: ${info.mimeType}`);
            const chunks = [];
            
            file.on('data', (chunk) => {
                chunks.push(chunk);
                fileSize += chunk.length;
                context.log(`Received chunk of size: ${chunk.length} bytes`);
            });

            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
                fileName = info.filename;
                context.log(`File processing complete. Total size: ${fileSize} bytes`);
            });
        });

        // Handle field data
        bb.on('field', (name, val) => {
            context.log(`Processing field: ${name}, value: ${val}`);
            if (name === 'positionTitle') {
                positionTitle = val;
            } else if (name === 'accountManager') {
                accountManagerId = val;
            }
        });

        // Wait for busboy to finish
        await new Promise((resolve, reject) => {
            bb.on('finish', resolve);
            bb.on('error', reject);
            req.pipe(bb);
        });

        // Validate file
        if (!fileBuffer) {
            context.log.error('No file received in request');
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    error: 'No file received in request',
                    details: 'Please ensure a file is included in the form data'
                }
            };
            return;
        }

        // Load account managers data
        let accountManager;
        try {
            const accountManagersPath = path.join(__dirname, '..', '..', 'src', 'config', 'accountManagers.json');
            const accountManagersData = fs.readFileSync(accountManagersPath, 'utf8');
            const accountManagers = JSON.parse(accountManagersData);

            // Validate that accountManagers is an array
            if (!Array.isArray(accountManagers)) {
                console.error("Account managers data is not an array:", accountManagers);
                throw new Error("Invalid account managers data format");
            }

            // Find selected account manager with proper type conversion
            accountManager = accountManagers.find(am => 
                am && am.id && am.id.toString() === (accountManagerId || '').toString()
            );

            // Fallback to first account manager if none found
            if (!accountManager && accountManagers.length > 0) {
                accountManager = accountManagers[0];
            }

            if (!accountManager) {
                throw new Error("No valid account managers found in configuration");
            }
        } catch (error) {
            console.error("Error loading account managers:", error);
            throw new Error("Failed to load account manager configuration: " + error.message);
        }

        // Convert Word document to PDF if necessary
        let documentBuffer = fileBuffer;
        const fileExtension = path.extname(fileName).toLowerCase();
        
        if (fileExtension === '.doc' || fileExtension === '.docx') {
            try {
                console.log("Converting Word document to PDF...");
                // Convert to PDF using libreoffice
                documentBuffer = await convertAsync(fileBuffer, '.pdf', undefined);
                console.log("Word document converted to PDF successfully");
            } catch (error) {
                console.error("Error converting Word document to PDF:", error);
                context.res = {
                    status: 500,
                    body: "Failed to convert Word document to PDF"
                };
                return;
            }
        }

        // Debug logging for environment variables
        console.log("Environment variables available:", Object.keys(process.env));
        console.log("Form Recognizer Endpoint:", process.env["FORM_RECOGNIZER_ENDPOINT"]);
        console.log("Storage Connection String exists:", !!process.env["AZURE_STORAGE_CONNECTION_STRING"]);

        // Initialize Azure Document Analysis client
        const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT"];
        const key = process.env["FORM_RECOGNIZER_KEY"];

        if (!endpoint || !key) {
            console.error("Missing credentials - Endpoint:", !!endpoint, "Key:", !!key);
            context.res = {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: "Form Recognizer credentials not found in environment variables"
                })
            };
            return;
        }

        console.log("Initializing Document Analysis client with endpoint:", endpoint);
        const client = new DocumentAnalysisClient(
            endpoint,
            new AzureKeyCredential(key.trim())
        );

        // Analyze the document
        console.log("Starting document analysis...");
        const poller = await client.beginAnalyzeDocument("prebuilt-document", documentBuffer);
        const { content, pages } = await poller.pollUntilDone();

        console.log("Document analysis completed. Content length:", content?.length);
        console.log("Number of pages:", pages?.length);

        if (!content || !pages || pages.length === 0) {
            throw new Error("Failed to extract content from the document");
        }

        // Extract CV data
        const cvData = await extractCVData(content, pages);
        console.log("CV data extracted:", JSON.stringify(cvData, null, 2));

        if (!cvData || !cvData.personalInfo) {
            throw new Error("Failed to extract required information from the CV");
        }

        // Create CloudMarc branded CV
        const convertedCV = await createCloudMarcCV(cvData, positionTitle, accountManager);

        // Initialize Azure Storage client
        const storageConnectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
        if (!storageConnectionString) {
            throw new Error("Azure Storage connection string not found in environment variables");
        }

        console.log("Initializing Azure Storage client...");
        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString.trim());
        const containerClient = blobServiceClient.getContainerClient("converted-cvs");
        
        console.log("Creating container if not exists...");
        await containerClient.createIfNotExists();

        // Generate unique filenames
        const timestamp = new Date().getTime();
        const baseFileName = `${timestamp}-${fileName.replace(/\.[^/.]+$/, '')}`;
        
        // Upload DOCX version
        const docxBlobName = `${baseFileName}-cloudmarc.docx`;
        const docxBlockBlobClient = containerClient.getBlockBlobClient(docxBlobName);
        await docxBlockBlobClient.upload(convertedCV.docx, convertedCV.docx.length);
        const docxSasUrl = await generateSasUrl(docxBlockBlobClient);

        // Upload PDF version
        const pdfBlobName = `${baseFileName}-cloudmarc.pdf`;
        const pdfBlockBlobClient = containerClient.getBlockBlobClient(pdfBlobName);
        await pdfBlockBlobClient.upload(convertedCV.pdf, convertedCV.pdf.length);
        const pdfSasUrl = await generateSasUrl(pdfBlockBlobClient);

        // Return success response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                message: "CV converted successfully",
                docxUrl: docxSasUrl,
                pdfUrl: pdfSasUrl,
                fileName: baseFileName
            }
        };
    } catch (error) {
        context.log.error('Error processing CV:', {
            error: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        // Determine appropriate status code
        const statusCode = error.statusCode || 
                          (error.message?.includes('validation') ? 400 : 500);

        // Prepare error response with more details
        const errorResponse = {
            error: error.message || 'An unexpected error occurred',
            type: error.constructor.name,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                cause: error.cause
            } : undefined
        };

        context.res = {
            status: statusCode,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: errorResponse
        };
    }
};

async function extractCVData(content, pages) {
    try {
        console.log("Starting CV data extraction...");
        const lines = content?.split('\n').filter(line => line.trim()) || [];
        const sections = [];
        let currentSection = null;

        // Improved section detection
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect section headers more reliably
            if (line.match(/^(WORK\s+EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s+EXPERIENCE|EXPERIENCE)/i)) {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'experience', title: line, content: [] };
            } else if (line.match(/^(EDUCATION|ACADEMIC|QUALIFICATIONS)/i)) {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'education', title: line, content: [] };
            } else if (line.match(/^(SKILLS|TECHNICAL\s+SKILLS|EXPERTISE|COMPETENCIES)/i)) {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'skills', title: line, content: [] };
            } else if (line.match(/^(SUMMARY|PROFILE|OBJECTIVE|ABOUT)/i)) {
                if (currentSection) sections.push(currentSection);
                currentSection = { type: 'summary', title: line, content: [] };
            } else if (currentSection) {
                currentSection.content.push(line);
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        // Extract personal information more reliably
        const personalInfo = {
            name: extractName(content, pages[0]) || "Name Not Found",
            email: extractEmail(content, pages[0]) || "Email Not Found",
            phone: extractPhone(content, pages[0]) || "Phone Not Found",
            location: extractLocation(content, pages[0]) || "Location Not Found"
        };

        console.log("Sections found:", sections.map(s => s.type));

        // Process work experience with improved extraction
        const workExperience = sections
            .filter(section => section.type === 'experience')
            .flatMap(section => {
                const content = section.content.join('\n');
                const experiences = extractWorkExperienceFromSection(content);
                console.log(`Extracted ${experiences.length} work experiences`);
                return experiences;
            });

        // Process education with improved extraction
        const education = sections
            .filter(section => section.type === 'education')
            .flatMap(section => {
                const content = section.content.join('\n');
                const educationItems = extractEducationFromSection(content);
                console.log(`Extracted ${educationItems.length} education items`);
                return educationItems;
            });

        // Process skills with improved extraction
        const skills = sections
            .filter(section => section.type === 'skills')
            .flatMap(section => {
                const content = section.content.join('\n');
                const skillItems = extractSkillsFromSection(content);
                console.log(`Extracted ${skillItems.length} skills`);
                return skillItems;
            });

        if (!workExperience.length && !education.length && !skills.length) {
            console.warn("No sections were successfully extracted. Raw content:", content);
            throw new Error("Failed to extract CV sections. Please check the format of your CV.");
        }

        const result = {
            personalInfo,
            workExperience: workExperience || [],
            education: education || [],
            skills: Array.from(new Set(skills || []))
        };

        console.log("CV data extraction completed:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("Error in CV data extraction:", error);
        throw error; // Propagate the error instead of returning empty data
    }
}

function extractName(content, page) {
    try {
        // Look for the name at the top of the first page
        if (page?.spans) {
            // Sort spans by y-position (top to bottom) and font size (largest to smallest)
            const topSpans = page.spans
                .filter(span => {
                    const boundingBox = span?.boundingBox;
                    // Look in top 25% of the page
                    return boundingBox && boundingBox.y > (page.boundingBox?.height || 0) * 0.75;
                })
                .sort((a, b) => {
                    // First sort by y-position (top to bottom)
                    const yDiff = (b.boundingBox?.y || 0) - (a.boundingBox?.y || 0);
                    if (Math.abs(yDiff) > 5) return yDiff;
                    // If y positions are close, sort by font size
                    return ((b.appearance?.fontSize || 0) - (a.appearance?.fontSize || 0));
                });

            // Look for name patterns in the top spans
            for (const span of topSpans) {
                const text = span.content?.trim();
                if (!text) continue;

                // Check for common name patterns
                if (text.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/)) {
                    return text;
                }
                // Check for names with middle initials
                if (text.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?\s+[A-Z][a-z]+)$/)) {
                    return text;
                }
                // Check for hyphenated names
                if (text.match(/^[A-Z][a-z]+(?:-[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+){1,2}$/)) {
                    return text;
                }
            }
        }

        // Fallback to content-based search
        const lines = content?.split('\n') || [];
        for (const line of lines.slice(0, 10)) { // Check first 10 lines
            const trimmed = line.trim();
            // Skip lines that look like headers or titles
            if (trimmed.match(/^(curriculum\s+vitae|resume|cv|profile)$/i)) continue;
            
            // Check for name patterns
            if (trimmed.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/)) {
                return trimmed;
            }
            if (trimmed.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?\s+[A-Z][a-z]+)$/)) {
                return trimmed;
            }
            if (trimmed.match(/^[A-Z][a-z]+(?:-[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+){1,2}$/)) {
                return trimmed;
            }
        }

        return null;
    } catch (error) {
        console.error("Error extracting name:", error);
        return null;
    }
}

function extractEmail(content, page) {
    try {
        const emailMatch = content?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return emailMatch ? emailMatch[0] : "Email Not Found";
    } catch (error) {
        console.error("Error extracting email:", error);
        return "Email Not Found";
    }
}

function extractPhone(content, page) {
    try {
        const phoneMatch = content?.match(/(\+?\d{1,3}[-.]?)?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        return phoneMatch ? phoneMatch[0] : "Phone Not Found";
    } catch (error) {
        console.error("Error extracting phone:", error);
        return "Phone Not Found";
    }
}

function extractLocation(content, page) {
    try {
        // Look for common location patterns (City, State/Country)
        const locationMatch = content?.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);
        return locationMatch ? locationMatch[0] : "Location Not Found";
    } catch (error) {
        console.error("Error extracting location:", error);
        return "Location Not Found";
    }
}

function extractWorkExperienceFromSection(content) {
    const experiences = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let currentExp = null;

    for (const line of lines) {
        // Match date patterns more flexibly
        const dateMatch = line.match(/(?:(?:19|20)\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(?:19|20)\d{2})(?:\s*[-–—]\s*(?:Present|Current|Now|(?:19|20)\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(?:19|20)\d{2}))?/i);

        // Check for company name pattern (all caps or followed by specific terms)
        const companyPattern = /^[A-Z\s&.]+$|(?:PTY|LTD|INC|LLC|CORPORATION|CONSULTING|TECHNOLOGIES|SOLUTIONS)\b/i;
        const isCompanyName = companyPattern.test(line);

        if (dateMatch || isCompanyName || (line.length > 0 && line.length < 100 && !line.startsWith('•') && !line.startsWith('-'))) {
            // Save previous experience if exists
            if (currentExp && (currentExp.title || currentExp.company || currentExp.period || currentExp.description.length > 0)) {
                experiences.push({...currentExp});
            }

            // Start new experience
            currentExp = {
                period: dateMatch ? dateMatch[0] : '',
                title: dateMatch ? line.replace(dateMatch[0], '').trim() : (isCompanyName ? '' : line),
                company: isCompanyName ? line : '',
                description: []
            };
        } else if (currentExp) {
            // If line starts with bullet or hyphen, it's a description point
            if (line.startsWith('•') || line.startsWith('-')) {
                currentExp.description.push(line.replace(/^[•-]\s*/, '').trim());
            } else if (!currentExp.company && line.length < 100) {
                // If company is not set and line is short, check if it's a company name
                if (companyPattern.test(line)) {
                    currentExp.company = line;
                } else if (!currentExp.title) {
                    // If no title is set, this might be the title
                    currentExp.title = line;
                }
            } else {
                // Otherwise add to description if it's not empty
                if (line.length > 0) {
                    currentExp.description.push(line);
                }
            }
        }
    }

    // Add the last experience
    if (currentExp && (currentExp.title || currentExp.company || currentExp.period || currentExp.description.length > 0)) {
        experiences.push({...currentExp});
    }

    // Post-process experiences to ensure all required fields have values
    return experiences.map(exp => ({
        period: exp.period || 'Period not specified',
        title: exp.title || 'Role not specified',
        company: exp.company || (exp.title ? exp.title.split(' at ')[1] || 'Company not specified' : 'Company not specified'),
        description: exp.description.length > 0 ? exp.description : ['No description provided']
    }));
}

function extractEducationFromSection(content) {
    const education = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    let currentEdu = null;

    // Enhanced patterns for better matching
    const degreePattern = /(?:bachelor|master|phd|doctorate|diploma|certificate|degree|bsc|msc|mba|btech|mtech|be|me|bcom|mcom|ba|ma|bs|ms)(?:\s+(?:of|in|with))?\s+[a-z\s,&]+/i;
    const institutionPattern = /(?:university|college|institute|school|academy|polytechnic)(?:\s+(?:of|for|in))?\s+[a-z\s,&]+/i;
    const yearPattern = /(?:19|20)\d{2}(?:\s*[-–—]\s*(?:Present|Current|Now|(?:19|20)\d{2}))?/i;
    const gradePattern = /(?:first class|second class|distinction|merit|honors|gpa:?\s*\d+(?:\.\d+)?|[A-D][+-]?|pass)/i;

    for (const line of lines) {
        const degreeMatch = line.match(degreePattern);
        const institutionMatch = line.match(institutionPattern);
        const yearMatch = line.match(yearPattern);
        const gradeMatch = line.match(gradePattern);

        // Start a new education entry if we find a degree, institution, or year
        if (degreeMatch || institutionMatch || yearMatch) {
            // Save previous entry if it exists and has meaningful data
            if (currentEdu && (currentEdu.degree || currentEdu.institution || currentEdu.period)) {
                education.push({...currentEdu});
            }

            // Initialize new education entry
            currentEdu = {
                degree: '',
                institution: '',
                period: '',
                grade: ''
            };

            // Update fields based on matches
            if (degreeMatch) {
                currentEdu.degree = degreeMatch[0].split(/\s+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            }
            if (institutionMatch) {
                currentEdu.institution = institutionMatch[0].split(/\s+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            }
            if (yearMatch) {
                currentEdu.period = yearMatch[0];
            }
            if (gradeMatch) {
                currentEdu.grade = gradeMatch[0].split(/\s+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            }

            // If the line contains multiple pieces of information
            const remainingText = line
                .replace(degreeMatch?.[0] || '', '')
                .replace(institutionMatch?.[0] || '', '')
                .replace(yearMatch?.[0] || '', '')
                .replace(gradeMatch?.[0] || '', '')
                .trim();

            if (remainingText) {
                if (!currentEdu.institution && institutionPattern.test(remainingText)) {
                    currentEdu.institution = remainingText;
                } else if (!currentEdu.degree && degreePattern.test(remainingText)) {
                    currentEdu.degree = remainingText;
                }
            }
        } else if (currentEdu) {
            // Handle additional information for current entry
            if (gradeMatch && !currentEdu.grade) {
                currentEdu.grade = gradeMatch[0].split(/\s+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            } else if (!currentEdu.institution) {
                currentEdu.institution = line;
            } else if (!currentEdu.degree) {
                currentEdu.degree = line;
            }
        }
    }

    // Add the last education entry if it exists
    if (currentEdu && (currentEdu.degree || currentEdu.institution || currentEdu.period)) {
        education.push({...currentEdu});
    }

    // Post-process education entries
    return education
        .map(edu => ({
            degree: edu.degree || 'Degree not specified',
            institution: edu.institution || 'Institution not specified',
            period: edu.period || 'Period not specified',
            grade: edu.grade || ''  // Grade is optional
        }))
        .filter(edu => 
            // Keep entries that have at least a degree or institution
            edu.degree !== 'Degree not specified' || 
            edu.institution !== 'Institution not specified'
        )
        .sort((a, b) => {
            // Sort by most recent first, using the start year
            const getYear = (period) => {
                const match = period.match(/\d{4}/);
                return match ? parseInt(match[0]) : 0;
            };
            return getYear(b.period) - getYear(a.period);
        });
}

function extractSkillsFromSection(content) {
    try {
        // Define skill patterns for each category
        const skillPatterns = {
            'Automation Tools': /\b(?:selenium|appium|katalon|nightwatch|cypress|playwright|webdriver|protractor|robot\s*framework|test\s*complete)\b/i,
            'Programming Languages': /\b(?:java|python|javascript|typescript|html|css|sql|xml|c#|ruby|php|scala|golang|swift|kotlin)\b/i,
            'Test Management Tools': /\b(?:jira|confluence|testlink|qtest|azure|tfs|alm|quality\s*center|test\s*rail|zephyr|xray)\b/i,
            'Cloud & DevOps': /\b(?:aws|azure|gcp|docker|kubernetes|jenkins|terraform|ci\/cd|git|github|gitlab|bitbucket)\b/i,
            'Testing Concepts': /\b(?:api testing|performance testing|load testing|security testing|automation framework|test strategy|test planning|agile testing)\b/i,
            'Other Tools': /\b(?:postman|swagger|soapui|fiddler|charles|wireshark|maven|gradle|npm|yarn)\b/i
        };

        // Initialize categories
        const skills = {
            'Automation Tools': new Set(),
            'Programming Languages': new Set(),
            'Test Management Tools': new Set(),
            'Cloud & DevOps': new Set(),
            'Testing Concepts': new Set(),
            'Other Tools': new Set()
        };

        // Clean and split content
        const words = content
            .replace(/[,;|•]/g, ' ')  // Replace common separators with space
            .split(/[\n\s]+/)         // Split by newlines and spaces
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 1);  // Filter out single characters

        // Process each word/phrase
        for (let i = 0; i < words.length; i++) {
            let phrase = words[i];
            
            // Try to form phrases of up to 3 words
            for (let j = 1; j <= 2 && i + j < words.length; j++) {
                const longerPhrase = phrase + ' ' + words[i + j];
                
                // Check if the longer phrase matches any patterns
                let matched = false;
                for (const [category, pattern] of Object.entries(skillPatterns)) {
                    if (pattern.test(longerPhrase)) {
                        skills[category].add(longerPhrase);
                        matched = true;
                        break;
                    }
                }
                
                if (matched) {
                    i += j;  // Skip the words we used in the phrase
                    break;
                }
                
                phrase = longerPhrase;
            }
            
            // Check single word if no phrase matched
            for (const [category, pattern] of Object.entries(skillPatterns)) {
                if (pattern.test(words[i])) {
                    skills[category].add(words[i]);
                    break;
                }
            }
        }

        // Convert sets to sorted arrays and remove empty categories
        const result = {};
        for (const [category, skillSet] of Object.entries(skills)) {
            if (skillSet.size > 0) {
                // Capitalize first letter of each word in skills
                result[category] = Array.from(skillSet)
                    .map(skill => skill
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    )
                    .sort();
            }
        }

        return result;
    } catch (error) {
        console.error("Error in skills extraction:", error);
        return {};
    }
}

async function createCloudMarcCV(cvData, positionTitle = '', accountManager) {
    try {
        if (!accountManager) {
            throw new Error("Account manager information is required");
        }

        // Create paragraphs array to hold all content for DOCX
        const paragraphs = [];

        // Add CloudMarc Logo
        paragraphs.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data: fs.readFileSync('src/assets/cloudmarc-logo.png'),
                        transformation: {
                            width: 150,
                            height: 50
                        }
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: 200
                }
            })
        );

        // Add name and title
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: sanitizeText(cvData.personalInfo.name),
                        size: 28,
                        color: "#666666"
                    })
                ],
                alignment: AlignmentType.RIGHT
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: positionTitle || "Senior Automation Test Analyst",
                        size: 24,
                        color: "#666666"
                    })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: {
                    after: 200
                }
            })
        );

        // Add CloudMarc contact info
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `CloudMarc Contact: ${accountManager.name} – ${accountManager.email} ${accountManager.phone}`,
                        size: 20,
                        color: "#FFFFFF"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 200
                },
                shading: {
                    fill: "#1B3C7C"
                }
            })
        );

        // Summary Section
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "SUMMARY",
                        size: 24,
                        bold: true,
                        color: "#1B3C7C"
                    })
                ],
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        // Add summary content
        const summary = generateProfileSummary(cvData, positionTitle);
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: summary,
                        size: 20,
                        color: "#666666"
                    })
                ],
                spacing: {
                    after: 200
                }
            })
        );

        // Education Section
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "EDUCATION AND TRAINING",
                        size: 24,
                        bold: true,
                        color: "#1B3C7C"
                    })
                ],
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        if (cvData.education && cvData.education.length > 0) {
            cvData.education.forEach(edu => {
                if (edu.degree) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: sanitizeText(edu.degree),
                                    size: 20,
                                    color: "#666666"
                                })
                            ]
                        })
                    );
                }
                if (edu.institution) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: sanitizeText(edu.institution),
                                    size: 20,
                                    italics: true,
                                    color: "#666666"
                                })
                            ],
                            spacing: {
                                after: 100
                            }
                        })
                    );
                }
            });
        }

        // Skills Section
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "SKILLS",
                        size: 24,
                        bold: true,
                        color: "#1B3C7C"
                    })
                ],
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        if (cvData.skills && cvData.skills.length > 0) {
            const skillCategories = {
                'Automation Tools': [],
                'Programming Languages': [],
                'Test Management Tools': [],
                'Related Tools/Software': []
            };

            // Categorize skills
            cvData.skills.forEach(skill => {
                if (skill.match(/selenium|appium|katalon|nightwatch|cypress|playwright/i)) {
                    skillCategories['Automation Tools'].push(skill);
                } else if (skill.match(/java|python|javascript|typescript|html|css|sql|xml/i)) {
                    skillCategories['Programming Languages'].push(skill);
                } else if (skill.match(/jira|confluence|testlink|qtest|azure|tfs/i)) {
                    skillCategories['Test Management Tools'].push(skill);
                } else {
                    skillCategories['Related Tools/Software'].push(skill);
                }
            });

            Object.entries(skillCategories).forEach(([category, skills]) => {
                if (skills.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${category}: `,
                                    size: 20,
                                    bold: true,
                                    color: "#666666"
                                }),
                                new TextRun({
                                    text: skills.join(', '),
                                    size: 20,
                                    color: "#666666"
                                })
                            ],
                            spacing: {
                                before: 100,
                                after: 100
                            }
                        })
                    );
                }
            });
        }

        // Career Summary Section
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "CAREER SUMMARY",
                        size: 24,
                        bold: true,
                        color: "#1B3C7C"
                    })
                ],
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        if (cvData.workExperience && cvData.workExperience.length > 0) {
            cvData.workExperience.forEach(exp => {
                // Company and Duration
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: sanitizeText(exp.company || ''),
                                size: 20,
                                color: "#F15A29"
                            }),
                            new TextRun({
                                text: "  " + sanitizeText(exp.period || ''),
                                size: 20,
                                color: "#666666"
                            })
                        ],
                        spacing: {
                            before: 100
                        }
                    })
                );

                // Position
                if (exp.title) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: sanitizeText(exp.title),
                                    size: 20,
                                    bold: true,
                                    color: "#666666"
                                })
                            ]
                        })
                    );
                }

                // Responsibilities
                if (exp.description && exp.description.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            text: "Responsibilities:",
                            size: 20,
                            spacing: {
                                before: 100
                            }
                        })
                    );

                    exp.description.forEach(point => {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "• " + sanitizeText(point),
                                        size: 20,
                                        color: "#666666"
                                    })
                                ],
                                spacing: {
                                    before: 50
                                }
                            })
                        );
                    });
                }
            });
        }

        // Add CloudMarc footer
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "CloudMarc",
                        size: 20,
                        bold: true,
                        color: "#1B3C7C"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 400
                }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "FOSTERING TRUST - CLIENT SUCCESS - QUALITY FOCUS - CONTINUOUS INNOVATION",
                        size: 16,
                        color: "#666666"
                    })
                ],
                alignment: AlignmentType.CENTER
            })
        );

        // Create the document with proper styling and margins
        const doc = new Document({
            sections: [{
                properties: {
                    type: SectionType.CONTINUOUS,
                    margin: {
                        top: 1000,
                        right: 1200,
                        bottom: 1000,
                        left: 1200
                    }
                },
                children: paragraphs
            }]
        });

        try {
            // Generate DOCX version
            const docxBuffer = await Packer.toBuffer(doc);

            // Create PDF using pdf-lib
            const pdfDoc = await PDFDocument.create();
            
            // Embed fonts
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
            
            const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
            const { width, height } = page.getSize();
            
            // Add CloudMarc logo
            const logoPath = 'src/assets/cloudmarc-logo.png';
            const logoImageBytes = fs.readFileSync(logoPath);
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            const logoDims = logoImage.scale(0.8); // Increased scale for larger logo
            
            // Position logo at top left with proper margins
            page.drawImage(logoImage, {
                x: 50,
                y: height - 100,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Add content
            const fontSize = 12;
            const headerFontSize = 24;
            const subHeaderFontSize = 18;
            const lineHeight = fontSize * 1.5;
            let currentY = height - 100;

            // Add name and title with better positioning
            const name = sanitizeText(cvData.personalInfo.name) || "Name Not Found";
            const title = sanitizeText(positionTitle) || "Senior Automation Test Analyst";
            
            // Right-align name and title
            const nameWidth = helveticaBoldFont.widthOfTextAtSize(name, headerFontSize);
            const titleWidth = helveticaFont.widthOfTextAtSize(title, subHeaderFontSize);
            
            page.drawText(name, {
                x: width - 50 - nameWidth,
                y: currentY,
                size: headerFontSize,
                font: helveticaBoldFont,
                color: rgb(0.4, 0.4, 0.4)
            });
            
            currentY -= lineHeight * 1.5;
            
            page.drawText(title, {
                x: width - 50 - titleWidth,
                y: currentY,
                size: subHeaderFontSize,
                font: helveticaFont,
                color: rgb(0.4, 0.4, 0.4)
            });

            // Add CloudMarc contact info with proper styling
            currentY -= lineHeight * 2;
            const contactInfo = `CloudMarc Contact: ${accountManager.name} – ${accountManager.email} ${accountManager.phone}`;
            
            // Draw blue background for contact info
            page.drawRectangle({
                x: 50,
                y: currentY - 10,
                width: width - 100,
                height: lineHeight * 1.5,
                color: rgb(0.11, 0.24, 0.49) // Navy blue
            });
            
            // Center contact info in the blue rectangle
            const contactWidth = helveticaFont.widthOfTextAtSize(contactInfo, fontSize);
            page.drawText(contactInfo, {
                x: (width - contactWidth) / 2,
                y: currentY,
                size: fontSize,
                font: helveticaFont,
                color: rgb(1, 1, 1) // White
            });

            // Add sections with improved spacing
            currentY -= lineHeight * 4;
            
            // Summary section with better formatting
            page.drawText("SUMMARY", {
                x: 50,
                y: currentY,
                size: subHeaderFontSize,
                font: helveticaBoldFont,
                color: rgb(0.11, 0.24, 0.49)
            });
            
            currentY -= lineHeight * 1.5;
            const summary = generateProfileSummary(cvData, positionTitle);
            const wrappedSummary = wrapText(summary, width - 100, fontSize);
            wrappedSummary.forEach(line => {
                page.drawText(line, {
                    x: 50,
                    y: currentY,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0.4, 0.4, 0.4)
                });
                currentY -= lineHeight;
            });

            // Education section with improved spacing
            currentY -= lineHeight * 2;
            page.drawText("EDUCATION AND TRAINING", {
                x: 50,
                y: currentY,
                size: subHeaderFontSize,
                font: helveticaBoldFont,
                color: rgb(0.11, 0.24, 0.49)
            });
            
            currentY -= lineHeight * 1.5;
            if (cvData.education && cvData.education.length > 0) {
                cvData.education.forEach(edu => {
                    if (edu.degree && edu.degree !== 'Degree not specified') {
                        page.drawText(sanitizeText(edu.degree), {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaBoldFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                        currentY -= lineHeight;
                    }
                    if (edu.institution && edu.institution !== 'Institution not specified') {
                        page.drawText(sanitizeText(edu.institution), {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaObliqueFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                        currentY -= lineHeight;
                    }
                    if (edu.period && edu.period !== 'Period not specified') {
                        page.drawText(sanitizeText(edu.period), {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                        currentY -= lineHeight;
                    }
                    currentY -= lineHeight / 2;
                });
            }

            // Skills section with improved formatting
            currentY -= lineHeight;
            page.drawText("SKILLS", {
                x: 50,
                y: currentY,
                size: subHeaderFontSize,
                font: helveticaBoldFont,
                color: rgb(0.11, 0.24, 0.49)
            });
            
            currentY -= lineHeight * 1.5;
            
            // Ensure skills is an object with categories
            const skillCategories = {
                'Automation Tools': [],
                'Programming Languages': [],
                'Test Management Tools': [],
                'Related Tools/Software': []
            };

            // Process skills array into categories
            if (Array.isArray(cvData.skills)) {
                cvData.skills.forEach(skill => {
                    if (typeof skill !== 'string') return;
                    const skillText = skill.trim();
                    
                    if (skillText.match(/selenium|appium|katalon|nightwatch|cypress|playwright/i)) {
                        skillCategories['Automation Tools'].push(skillText);
                    } else if (skillText.match(/java|python|javascript|typescript|html|css|sql|xml/i)) {
                        skillCategories['Programming Languages'].push(skillText);
                    } else if (skillText.match(/jira|confluence|testlink|qtest|azure|tfs/i)) {
                        skillCategories['Test Management Tools'].push(skillText);
                    } else {
                        skillCategories['Related Tools/Software'].push(skillText);
                    }
                });
            } else if (typeof cvData.skills === 'object' && cvData.skills !== null) {
                // If skills is already categorized, use it directly
                Object.entries(cvData.skills).forEach(([category, skills]) => {
                    if (Array.isArray(skills)) {
                        if (!skillCategories[category]) {
                            skillCategories[category] = [];
                        }
                        skillCategories[category].push(...skills.filter(s => typeof s === 'string').map(s => s.trim()));
                    }
                });
            }

            // Draw skills categories
            Object.entries(skillCategories).forEach(([category, skills]) => {
                if (skills.length > 0) {
                    const categoryText = `${category}: `;
                    page.drawText(categoryText, {
                        x: 50,
                        y: currentY,
                        size: fontSize,
                        font: helveticaBoldFont,
                        color: rgb(0.4, 0.4, 0.4)
                    });

                    const skillsText = skills.join(', ');
                    const wrappedSkills = wrapText(skillsText, width - 150 - helveticaBoldFont.widthOfTextAtSize(categoryText, fontSize), fontSize);
                    wrappedSkills.forEach((line, index) => {
                        page.drawText(line, {
                            x: index === 0 ? 50 + helveticaBoldFont.widthOfTextAtSize(categoryText, fontSize) : 50,
                            y: currentY - (index * lineHeight),
                            size: fontSize,
                            font: helveticaFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                    });
                    currentY -= (wrappedSkills.length + 1) * lineHeight;
                }
            });

            // Career Summary section with improved formatting
            currentY -= lineHeight;
            page.drawText("CAREER SUMMARY", {
                x: 50,
                y: currentY,
                size: subHeaderFontSize,
                font: helveticaBoldFont,
                color: rgb(0.11, 0.24, 0.49)
            });
            
            currentY -= lineHeight * 1.5;
            if (cvData.workExperience && cvData.workExperience.length > 0) {
                cvData.workExperience.forEach((exp, index) => {
                    if (index > 0) currentY -= lineHeight;

                    // Company and Duration on same line
                    const companyText = sanitizeText(exp.company || '');
                    if (companyText && companyText !== 'Company not specified') {
                        page.drawText(companyText, {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaBoldFont,
                            color: rgb(0.95, 0.35, 0.16) // Orange
                        });
                    
                        if (exp.period && exp.period !== 'Period not specified') {
                            const periodText = sanitizeText(exp.period);
                            page.drawText(periodText, {
                                x: 50 + helveticaBoldFont.widthOfTextAtSize(companyText + '  ', fontSize),
                                y: currentY,
                                size: fontSize,
                                font: helveticaFont,
                                color: rgb(0.4, 0.4, 0.4)
                            });
                        }
                        currentY -= lineHeight;
                    }

                    // Position
                    if (exp.title && exp.title !== 'Role not specified') {
                        page.drawText(sanitizeText(exp.title), {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaBoldFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                        currentY -= lineHeight;
                    }

                    // Responsibilities
                    if (exp.description && exp.description.length > 0 && exp.description[0] !== 'No description provided') {
                        page.drawText("Responsibilities:", {
                            x: 50,
                            y: currentY,
                            size: fontSize,
                            font: helveticaBoldFont,
                            color: rgb(0.4, 0.4, 0.4)
                        });
                        currentY -= lineHeight;

                        exp.description.forEach(point => {
                            if (point.trim()) {
                                const bulletPoint = "• ";
                                page.drawText(bulletPoint, {
                                    x: 50,
                                    y: currentY,
                                    size: fontSize,
                                    font: helveticaFont,
                                    color: rgb(0.4, 0.4, 0.4)
                                });

                                const wrappedPoint = wrapText(sanitizeText(point), width - 150, fontSize);
                                wrappedPoint.forEach((line, index) => {
                                    page.drawText(line, {
                                        x: 65,
                                        y: currentY - (index * lineHeight),
                                        size: fontSize,
                                        font: helveticaFont,
                                        color: rgb(0.4, 0.4, 0.4)
                                    });
                                });
                                currentY -= (wrappedPoint.length + 0.5) * lineHeight;
                            }
                        });
                    }
                    currentY -= lineHeight;
                });
            }

            // Add footer with improved positioning
            currentY = 50;
            const footerText = "CloudMarc";
            const footerWidth = helveticaBoldFont.widthOfTextAtSize(footerText, fontSize);
            page.drawText(footerText, {
                x: (width - footerWidth) / 2,
                y: currentY,
                size: fontSize,
                font: helveticaBoldFont,
                color: rgb(0.11, 0.24, 0.49)
            });
            
            currentY -= lineHeight;
            const taglineText = "FOSTERING TRUST - CLIENT SUCCESS - QUALITY FOCUS - CONTINUOUS INNOVATION";
            const taglineWidth = helveticaFont.widthOfTextAtSize(taglineText, 10);
            page.drawText(taglineText, {
                x: (width - taglineWidth) / 2,
                y: currentY,
                size: 10,
                font: helveticaFont,
                color: rgb(0.4, 0.4, 0.4)
            });

            const pdfBytes = await pdfDoc.save();

            return {
                docx: docxBuffer,
                pdf: Buffer.from(pdfBytes)
            };
        } catch (error) {
            console.error('Error generating document:', error);
            throw new Error('Failed to generate document: ' + error.message);
        }
    } catch (error) {
        console.error("Error in CV conversion:", error);
        throw new Error("An error occurred while converting the CV: " + error.message);
    }
}

// Helper function to wrap text
function wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = (currentLine.length + word.length + 1) * (fontSize * 0.6); // Approximate width
        
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function generateProfileSummary(cvData, positionTitle) {
    const yearsOfExperience = calculateTotalExperience(cvData.workExperience);
    const recentRole = cvData.workExperience[0];
    
    let summary = `${cvData.personalInfo.name} is an accomplished Test Automation Engineer with over ${yearsOfExperience} years of experience in designing innovative automation frameworks and leading cross-functional teams. `;
    
    if (recentRole) {
        summary += `Currently serving as ${recentRole.title} at ${recentRole.company}, they have a proven track record of enhancing software quality and operational efficiency through a combination of strategic leadership and advanced technical solutions. `;
    }
    
    summary += `They excel in mentoring team members, optimizing recruitment processes, and consistently driving results within Agile environments. Their strong technical foundation, combined with their leadership abilities, makes them a valuable asset to any organization focused on delivering high-quality software solutions.`;
    
    return summary;
}

function calculateTotalExperience(workExperience) {
    if (!workExperience || workExperience.length === 0) return 0;
    
    let totalYears = 0;
    const currentYear = new Date().getFullYear();
    
    workExperience.forEach(exp => {
        if (exp.period) {
            const years = exp.period.match(/\d{4}/g);
            if (years && years.length >= 2) {
                totalYears += parseInt(years[1]) - parseInt(years[0]);
            } else if (years && years.length === 1) {
                // If end year is not specified, assume it's current
                totalYears += currentYear - parseInt(years[0]);
            }
        }
    });
    
    return Math.max(1, Math.round(totalYears)); // Ensure at least 1 year
}

async function generateSasUrl(blockBlobClient) {
    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + 60); // URL valid for 60 minutes

    const sasOptions = {
        containerName: blockBlobClient.containerName,
        blobName: blockBlobClient.name,
        permissions: BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https
    };

    const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        blockBlobClient.credential
    ).toString();

    return `${blockBlobClient.url}?${sasToken}`;
} 