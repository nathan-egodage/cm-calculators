# CloudMarc CV Converter

An AI-powered CV conversion application that transforms standard CVs into CloudMarc's branded format.

## Features

- AI-powered CV content extraction
- Automatic formatting to CloudMarc's brand guidelines
- Support for PDF, DOC, and DOCX formats
- Account manager integration
- Secure authentication and authorization
- Downloadable results in both DOCX and PDF formats

## Project Structure

```
├── api/                 # Azure Functions backend
│   └── convert-cv/      # CV conversion function
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   └── styles/         # CSS styles
└── public/             # Static assets
```

## Prerequisites

- Node.js (v14 or later)
- Azure Functions Core Tools
- Azure subscription
- GitHub account

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd api && npm install
   ```

2. Set up environment variables:
   - Create `.env` file in root directory
   - Add required environment variables (see `.env.example`)

3. Start the development server:
   ```bash
   npm start
   ```

4. Start the Azure Functions locally:
   ```bash
   cd api
   func start
   ```

## Deployment

### Azure Static Web Apps Deployment

1. Ensure your code is committed to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. The GitHub Actions workflow will automatically deploy:
   - Frontend to Azure Static Web Apps
   - API to Azure Functions

3. Monitor deployment in:
   - GitHub Actions tab
   - Azure Portal > Static Web Apps > [Your App] > GitHub Actions runs

### Environment Variables

Required environment variables in Azure:

- `FORM_RECOGNIZER_ENDPOINT`
- `FORM_RECOGNIZER_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`

Set these in Azure Portal:
1. Go to Static Web Apps > Configuration
2. Add each environment variable
3. Save changes

### Post-Deployment

1. Verify the deployment:
   - Check application URL
   - Test CV conversion
   - Verify account manager integration

2. Monitor the application:
   - Check Azure Application Insights
   - Review logs in Azure Portal

## Security

- Authentication handled by Azure Static Web Apps
- Authorization rules in `staticwebapp.config.json`
- Secure API endpoints with function-level authentication
- Environment variables for sensitive data

## Troubleshooting

Common issues and solutions:

1. **CV Conversion Fails**
   - Check Azure Function logs
   - Verify Form Recognizer service status
   - Check storage account permissions

2. **Authentication Issues**
   - Verify Azure AD configuration
   - Check authorized users list
   - Review CORS settings

3. **Deployment Failures**
   - Check GitHub Actions logs
   - Verify Azure credentials
   - Review build configuration

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Contact CloudMarc support team

## License

Proprietary - CloudMarc © 2024
