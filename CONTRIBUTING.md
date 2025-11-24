# Contributing to FREE LMS

First off, thank you for considering contributing to FREE LMS! It's people like you that make FREE LMS such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples
* Describe the behavior you observed and what you expected
* Include screenshots if relevant
* Note your environment (OS, Browser, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

* A clear and descriptive title
* A detailed description of the proposed enhancement
* Examples of how the enhancement would be used
* Why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Write a clear commit message
6. Create a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/FREE_LMS.git
cd FREE_LMS

# Install dependencies
npm run install:all

# Start development
docker-compose up -d postgres redis minio
cd backend && npm run start:dev
cd frontend && npm start
```

## Code Style

* Use TypeScript
* Follow existing code patterns
* Write clear, commented code
* Add JSDoc comments for public APIs

## Testing

* Write unit tests for new features
* Run `npm test` before submitting PR
* Maintain test coverage above 80%

## Documentation

* Update README.md if needed
* Add JSDoc comments
* Update API documentation

## Community

* Join our discussions
* Help answer questions
* Share your ideas

Thank you for contributing! 🎉
