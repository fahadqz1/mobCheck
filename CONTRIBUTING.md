# Contributing to MobCheck

## Development Guidelines

### Code Quality

- Write TypeScript with `strict: true`
- Follow existing code style and patterns
- Use meaningful variable and function names
- Keep functions focused and testable
- Add comments only for the "why", not the "what"

### Git Workflow

- Create a feature branch: `git checkout -b feature/description`
- Make focused commits with clear messages
- Keep commit history clean
- Test before pushing
- Create pull request with detailed description

### Testing Requirements

- Write tests for new features
- Ensure existing tests pass: `npm test`
- Run E2E tests before merge: `npm run test:e2e`
- Target 80%+ code coverage for critical paths

### Security

- Never commit secrets, API keys, or credentials
- Validate all user input server-side
- Review OWASP checklist before merge
- Run security tests: `npm run test:security`

### Database Changes

- Create migrations for schema changes: `npm run db:create-migration`
- Test migrations on fresh database
- Never drop tables without approval
- Document breaking changes

### Documentation

- Update relevant docs for feature changes
- Keep README.md current
- Document API changes in API.md
- Add JSDoc comments to public functions

### Code Review

- Address all feedback before merging
- Run lint and type checks: `npm run lint && npm run type-check`
- Verify no sensitive data in diff
- Get approval from maintainer

## Questions?

Refer to the documentation in `/docs` or contact the product team.
