# API Integrator

A powerful, client-side web application for integrating multiple APIs and databases with visual mapping capabilities and automated code generation.

## 🚀 Features

### **Core Functionality**
- **Visual API Integration**: Create mappings between different data sources with an intuitive drag-and-drop interface
- **Multi-Language Code Generation**: Generate integration code in Python, PHP, and Go
- **Real-time Testing**: Test API connections and field mappings before deployment
- **Privacy-First Design**: Everything runs entirely in your browser - no data sent to external servers

### **Advanced Features**
- **Optimized Data Fetching**: Fetches data from each source once at the beginning, not per mapping
- **Granular Endpoint Configuration**: Configure only the endpoints you need (receive, update, or both)
- **Smart Connection Testing**: Separate testing for receive and update endpoints with non-intrusive methods
- **Automatic Cleanup**: Remove associated mappings when deleting sources
- **Local Storage**: All configurations stored locally in your browser

## 🛠️ Technical Features

### **API Configuration**
- **Flexible Endpoint Setup**: Configure receive and update endpoints separately
- **Custom Headers & Authentication**: Support for custom headers, API keys, and tokens
- **Multiple HTTP Methods**: Support for GET, POST, PUT, PATCH, HEAD, and OPTIONS
- **JSON Payload Support**: Configure request bodies and response examples
- **Field Mapping**: Visual mapping between source and target fields using dot notation

### **Code Generation**
- **Optimized Architecture**: Efficient data fetching pattern that minimizes API calls
- **Error Handling**: Comprehensive error handling and logging
- **Helper Functions**: Built-in functions for nested value extraction
- **Production Ready**: Generated code follows best practices and is ready for deployment

### **Testing Capabilities**
- **Connection Testing**: Test API endpoints with actual requests
- **Receive Endpoint Testing**: Fetches real data to verify connectivity
- **Update Endpoint Testing**: Non-intrusive reachability testing using OPTIONS/HEAD methods
- **Mapping Simulation**: Test data transformations without making actual API calls

## 🌐 Privacy & Security

### **Client-Side Only**
- **No Server Required**: All processing happens in your browser
- **No Data Collection**: We don't collect personal information or usage data
- **Local Storage**: Configurations stored only in your browser's localStorage
- **Direct API Calls**: Your APIs are called directly from your browser

### **Security Best Practices**
- **Credential Protection**: API keys and tokens never leave your browser
- **HTTPS Support**: Secure connections to external APIs
- **CORS Compliant**: Works with modern CORS-enabled APIs
- **Input Validation**: Proper validation and sanitization of user inputs

## 📱 User Interface

### **Modern Design**
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Professional Styling**: Clean, modern interface with smooth animations
- **Intuitive Navigation**: Clear sections for sources, mappings, testing, and code generation
- **Visual Feedback**: Hover effects, loading states, and success/error indicators

### **Accessibility**
- **Semantic HTML**: Proper use of HTML5 semantic elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Compatible with assistive technologies
- **High Contrast**: Proper color contrast ratios for readability

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API testing
- API endpoints and credentials for your data sources

### **Installation**
1. Clone or download the repository
2. Open `index.html` in your web browser
3. No additional setup required - it's a pure client-side application!

### **Basic Usage**
1. **Add Sources**: Click "Add Source" to configure your APIs and databases
2. **Create Mappings**: Use the visual interface to map fields between sources
3. **Test Connections**: Verify your API endpoints are working
4. **Generate Code**: Select your preferred language and generate integration code
5. **Deploy**: Use the generated code in your applications

## 📖 Advanced Usage

### **Source Configuration**
```json
{
  "name": "My API Source",
  "type": "API",
  "receiveEndpoint": "https://api.example.com/data",
  "receiveMethod": "GET",
  "receiveHeaders": {"Authorization": "Bearer token"},
  "updateEndpoint": "https://api.example.com/update",
  "updateMethod": "POST",
  "updateHeaders": {"Content-Type": "application/json"}
}
```

### **Field Mapping**
- **Dot Notation**: Use `user.profile.name` to access nested fields
- **Transformations**: Map `sourceField` to `targetField` with automatic extraction
- **Visual Interface**: Click on fields to create connections
- **Batch Operations**: Map multiple fields efficiently

### **Code Generation Examples**

#### Python
```python
# Fetch data from all sources once
source1_data = fetch_from_source1()
source2_data = fetch_from_source2()

# Process all mappings using fetched data
transformed_data = {
    'target_field': get_nested_value(source1_data, 'source.field')
}
send_to_target(transformed_data)
```

#### PHP
```php
// Similar optimized pattern with helper functions
$source1_data = fetchFromSource1();
$transformed_data = [
    'target_field' => getNestedValue($source1_data, 'source.field')
];
sendToTarget($transformed_data);
```

#### Go
```go
// Concurrent fetching with goroutines
source1Data := fetchFromSource1()
transformedData := map[string]interface{}{
    "target_field": getNestedValue(source1Data, "source.field"),
}
sendToTarget(transformedData)
```

## 🔧 Configuration Options

### **Source Types Supported**
- **REST APIs**: GET, POST, PUT, PATCH, DELETE methods
- **GraphQL APIs**: Query and mutation endpoints
- **SOAP APIs**: WSDL-based services
- **Databases**: Direct database connections (planned)

### **Authentication Methods**
- **API Keys**: Header-based authentication
- **Bearer Tokens**: OAuth 2.0 and JWT tokens
- **Basic Auth**: Username/password authentication
- **Custom Headers**: Any custom authentication scheme

### **Data Formats**
- **JSON**: Primary format for APIs
- **XML**: Support for XML-based APIs
- **Form Data**: URL-encoded form submissions
- **Binary**: File uploads and downloads

## 🧪 Testing Features

### **Connection Testing**
- **Receive Testing**: Actual data retrieval with full response display
- **Update Testing**: Non-destructive endpoint reachability verification
- **Error Handling**: Detailed error messages and debugging information
- **Timeout Management**: Configurable timeouts for different environments

### **Mapping Testing**
- **Data Simulation**: Test transformations without live API calls
- **Field Validation**: Verify field mappings work correctly
- **Payload Preview**: See the exact data that will be sent
- **Batch Testing**: Test multiple mappings simultaneously

## 🔄 Data Management

### **Local Storage**
- **Persistent Configurations**: Sources and mappings saved between sessions
- **Export/Import**: Backup and restore your configurations
- **Clear Data**: Option to clear all stored data
- **Privacy**: All data remains on your device

### **Cleanup Features**
- **Automatic Cleanup**: Remove mappings when sources are deleted
- **Orphan Detection**: Identify and clean up broken references
- **Data Validation**: Ensure data integrity
- **Storage Optimization**: Efficient use of browser storage

## 🎯 Use Cases

### **Common Scenarios**
- **Data Synchronization**: Keep multiple systems in sync
- **API Aggregation**: Combine data from multiple APIs
- **Data Migration**: Move data between different systems
- **Integration Testing**: Test API integrations before deployment
- **Microservices**: Connect services in a microservices architecture

### **Industry Applications**
- **E-commerce**: Sync inventory, orders, and customer data
- **Finance**: Integrate banking and payment APIs
- **Healthcare**: Connect medical record systems
- **IoT**: Process data from multiple IoT devices
- **Marketing**: Integrate CRM and marketing automation

## 🛡️ Security Considerations

### **Best Practices**
- **API Key Management**: Use environment-specific keys
- **HTTPS Only**: Always use secure connections
- **Input Validation**: Validate all user inputs
- **Error Handling**: Don't expose sensitive information in errors

### **Recommendations**
- **Shared Computers**: Clear data after use on shared devices
- **Browser Security**: Keep your browser updated
- **Network Security**: Use secure networks for API testing
- **Credential Rotation**: Regularly update API keys and tokens

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Code Style**
- **JavaScript**: Use modern ES6+ features
- **CSS**: Follow BEM methodology for class names
- **HTML**: Use semantic HTML5 elements
- **Comments**: Document complex logic and functions

### **Testing**
- **Manual Testing**: Test all features in different browsers
- **API Testing**: Verify with real API endpoints
- **Responsive Testing**: Test on various screen sizes
- **Accessibility Testing**: Use screen readers and keyboard navigation

## 📝 Changelog

### **Version 1.0** (November 2025)
- ✨ Initial release with core functionality
- 🎨 Modern UI design with responsive layout
- 🔒 Privacy-focused client-side architecture
- 🧪 Comprehensive testing capabilities
- 📝 Multi-language code generation
- 🚀 Optimized data fetching patterns
- 🔧 Granular endpoint configuration
- 🧹 Automatic cleanup features
- 📱 Enhanced mobile experience
- 🛡️ Improved security practices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

### **Getting Help**
- **Documentation**: Check this README and inline documentation
- **Issues**: Report bugs on [GitHub Issues](https://github.com/anastasios-bolkas/api-integrator/issues)
- **Features**: Request new features via GitHub Issues
- **Discussions**: Join community discussions on GitHub

### **Contact**
- **Author**: Anastasios Bolkas
- **Website**: [anastasios-bolkas.tech](https://anastasios-bolkas.tech)
- **GitHub**: [@anastasios-bolkas](https://github.com/anastasios-bolkas)
- **Privacy**: [Privacy Policy](privacy-policy.html)

## 🌟 Acknowledgments

- **Modern Web Standards**: Built with HTML5, CSS3, and ES6+
- **Open Source Libraries**: Thanks to the open source community
- **API Standards**: Following REST and GraphQL best practices
- **User Feedback**: Continuous improvement based on user experience

---

**API Integrator** - Making API integration simple, secure, and efficient. 🚀
