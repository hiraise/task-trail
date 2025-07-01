![MIT License](https://img.shields.io/github/license/hiraise/tt-frontend)

---

🚀 **Live Demo:** [https://dev.hiraise.net/tasktrail/](https://dev.hiraise.net/tasktrail/)

---

# TaskTrail

TaskTrail is a modern, open-source, self-hosted task tracking web application built with **Next.js** and TypeScript. The project follows a modular, Clean Architecture-inspired structure for scalability, maintainability, and clear separation of concerns.

## Features

- **Authentication**: Login and signup with Redux Toolkit state management
- **Responsive Design**: Mobile-first, adaptive UI
- **Localization**: Multi-language support for text and images
- **Reusable Components**: Library of UI components and widgets
- **Centralized Error Handling**: Global and local error management
- **Extensible Architecture**: Easily add new features and integrations
- **Go Backend Integration**: In progress (currently using mock API for some features)
- **Testing**: Vitest and Testing Library (coverage expanding)

## Tech Stack

- **Next.js** (App Router, SSR-ready)
- **TypeScript**
- **Redux Toolkit**
- **styled-components**
- **Vitest** + **Testing Library**

## Project Structure

```
src/
├── app/             # Application entry points and pages
│   ├── (auth)/      # Authentication pages (login, signup)
│   ├── dashboard/   # Dashboard layout and pages
├── application/     # Application-specific use-cases and logic
├── domain/          # Core business logic and domain entities
├── infrastructure/  # API clients, config, redux store
├── presentation/    # UI components and widgets
├── shared/          # Utilities, hooks, localization, errors
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**

### Installation

```bash
git clone https://github.com/SergeyRusinovich/tt-frontend.git
cd tt-frontend
npm install # or yarn install
```

### Running Locally

```bash
npm run dev # or yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build # or yarn build
```

Production files will be in the `out/` directory.

### Testing

```bash
npm test # or yarn test
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Description of changes"`
4. Push to your fork: `git push origin feature-name`
5. Open a pull request

## Roadmap

- [x] Login system with mock API
- [x] Route protection with auth guard
- [ ] Task board UI
- [ ] Real backend (Go) integration
- [ ] Project management features

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Architecture Overview

TaskTrail uses a modular architecture inspired by Clean Architecture principles:

- **App Layer (`app/`)**: Entry points and routing
- **Application Layer (`application/`)**: Use-cases, state, and side effects
- **Domain Layer (`domain/`)**: Core business logic, domain entities, framework-agnostic
- **Infrastructure Layer (`infrastructure/`)**: API clients, config, redux store
- **Presentation Layer (`presentation/`)**: UI components and widgets
- **Shared Layer (`shared/`)**: Utilities, hooks, localization, errors

This structure ensures scalability, maintainability, and a clear separation of concerns.
