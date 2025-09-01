# TaskTrail

![MIT License](https://img.shields.io/github/license/hiraise/tt-frontend)
![GitHub stars](https://img.shields.io/github/stars/hiraise/tt-frontend)
![GitHub forks](https://img.shields.io/github/forks/hiraise/tt-frontend)
![GitHub issues](https://img.shields.io/github/issues/hiraise/tt-frontend)

---

🚀 **Live Demo:** [https://dev.hiraise.net/tasktrail/](https://dev.hiraise.net/tasktrail/)

---

TaskTrail is a modern, open-source, self-hosted task tracking web application built with **Next.js** and TypeScript. The project follows a modular, Clean Architecture-inspired structure for scalability, maintainability, and clear separation of concerns.

## Features

- **Authentication**: Login and signup functionality.
- **State Management**: Client-side state management with Zustand and server-side state with React Query.
- **Responsive Design**: Mobile-first, adaptive UI for all screen sizes.
- **Localization**: Multi-language support for text and images.
- **Reusable Components**: A rich library of UI components and widgets.
- **Centralized Error Handling**: Global and local error management for a consistent user experience.
- **Extensible Architecture**: Easily add new features and integrations.
- **Testing**: Unit and integration tests with Jest and React Testing Library.

## Tech Stack

- **Next.js** (App Router, SSR)
- **TypeScript**
- **Zustand** (for client-side state management)
- **React Query** (for server-side state management)
- **Styled-components**
- **Jest** + **React Testing Library**
- **ESLint** for code quality

## Project Structure

```
src/
├── app/                # Next.js App Router, pages, and layouts
│   ├── _components/      # Global layout components
│   ├── (auth)/           # Authentication-related pages
│   ├── dashboard/        # Main dashboard page
│   └── ...               # Other feature-based routes
├── application/        # Application-level logic (use cases)
│   ├── auth/
│   ├── projects/
│   └── ...
├── domain/             # Core business logic and entities
│   ├── auth/
│   ├── project/
│   └── ...
├── infrastructure/     # API clients, configurations
│   ├── api/
│   └── config/
├── presentation/       # UI components
│   ├── ui/               # Generic, reusable UI components
│   └── widgets/          # Composite components (widgets)
└── shared/             # Shared utilities, hooks, constants, etc.
    ├── constants/
    ├── hooks/
    ├── locales/
    └── utils/
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/SergeyRusinovich/tt-frontend.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd tt-frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

To run the app in development mode, use:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To build the application for production, use:

```bash
npm run build
```

This will create an optimized build in the `.next` directory.

### Running Tests

To run the test suite, use:

```bash
npm test
```

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch:**
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **Make your changes and commit them:**
    ```bash
    git commit -m "feat: Add your new feature"
    ```
4.  **Push to your branch:**
    ```bash
    git push origin feature/your-feature-name
    ```
5.  **Open a pull request** against the `main` branch.

## Roadmap

- [x] Login system with mock API
- [x] Route protection with auth guard
- [x] Task board UI
- [x] User profile page
- [x] Basic project management features
- [ ] Real backend (Go) integration
- [ ] Team collaboration features

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Architecture Overview

TaskTrail uses a modular architecture inspired by Clean Architecture principles to ensure a clean separation of concerns, making the codebase scalable and maintainable.

- **`app`**: The entry point of the application, containing routes, layouts, and pages as per the Next.js App Router paradigm.
- **`application`**: Contains the application-specific business rules and use cases. It orchestrates the flow of data between the domain and the infrastructure layers.
- **`domain`**: The core of the application, containing the business logic and entities. This layer is independent of any framework or external dependency.
- **`infrastructure`**: Implements the interfaces defined in the application layer, handling external concerns like API communication, database access, etc.
- **`presentation`**: Contains the UI components, widgets, and everything related to the user interface.
- **`shared`**: A collection of utilities, hooks, constants, and other shared code that can be used across the entire application.
