![MIT License](https://img.shields.io/github/license/hiraise/tt-frontend)

# Project Overview

This project is a web application built using **Next.js**. It follows a modular architecture inspired by Clean Architecture principles, ensuring scalability, maintainability, and clear separation of concerns.

## Key Features

- **Authentication**: Includes login and signup functionality with Redux Toolkit for state management.
- **Responsive Design**: Components are optimized for both desktop and mobile devices.
- **Localization**: Supports localization for text and images.
- **Reusable Components**: Includes a library of reusable UI components and widgets.
- **Error Handling**: Centralized error handling for global and local errors.

## Project Goals

This project is an open-source, self-hosted task tracking web application focused on:

- **Clean modular frontend architecture**
- **Mobile-first UI**
- **Scalable and extensible features**
- **Integration with a Go backend (in progress)**

## Tech Stack

- **Next.js** (App Router, SSR-ready)
- **TypeScript**
- **Redux Toolkit**
- **styled-components**
- **Vitest** + **Testing Library** (planned)

## Folder Structure

The project is organized as follows:

```
src/
├── app/                     # Application entry points and pages
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── dashboard/           # Dashboard layout and pages
├── application/             # Application-specific use-cases and logic
│   ├── auth/                # Authentication logic (hooks, slices, thunks)
├── domain/                  # Core business logic and domain entities
├── infrastructure/          # Infrastructure and external dependencies
│   ├── api/                 # API clients and endpoints
│   ├── redux/               # Redux store and middleware
├── presentation/            # UI components and widgets
│   ├── ui/                  # Reusable UI components
│   ├── widgets/             # Complex widgets (e.g., forms)
├── shared/                  # Shared utilities and modules
│   ├── errors/              # Error handling utilities
│   ├── hooks/               # Custom React hooks
│   ├── locales/             # Localization files
```

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/SergeyRusinovich/tt-frontend.git
   cd tt-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Running the Project

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Building for Production

To build the project for production:

```bash
npm run build
# or
yarn build
```

The production-ready files will be available in the `out/` directory.

## Testing

To run tests (if applicable):

```bash
npm test
# or
yarn test
```

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git commit -m "Description of changes"
   git push origin feature-name
   ```
4. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Roadmap

- [x] Login system with mock API
- [x] Protect routes with auth guard
- [ ] Implement task board UI
- [ ] Integrate real backend (Go)
- [ ] Add project management features

# Project Architecture

This project follows a modular architecture inspired by Clean Architecture principles. Below is an overview of the architectural layers and their purpose:

## Architectural Layers

1. **App Layer (`app/`)**:

   - Contains the entry points and routing for the application.
   - Each page is modularized into its own folder.

2. **Application Layer (`application/`)**:

   - Contains use-cases and application-specific logic.
   - Manages state and side effects (e.g., API calls).

3. **Domain Layer (`domain/`)**:

   - Contains core business logic and domain entities.
   - Independent of frameworks and external dependencies.

4. **Infrastructure Layer (`infrastructure/`)**:

   - Handles external dependencies such as API calls and configuration.
   - Provides the Redux store setup.

5. **Presentation Layer (`presentation/`)**:

   - Contains UI components and widgets.
   - Divided into reusable components (`ui/`) and complex widgets (`widgets/`).

6. **Shared Layer (`shared/`)**:
   - Contains utilities, hooks, and localization files that can be reused across the application.

This architecture ensures a clear separation of concerns, making the project scalable, maintainable, and easy to understand.
