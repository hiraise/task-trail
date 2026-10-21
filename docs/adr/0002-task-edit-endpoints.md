# ADR 0002: Edit task

Date: 2025-09-15  
Status: Active

## Context

Required and API to manipulate tasks state. Considered:

- one endpoint to edit task, change status, project and assignee.
- multiple enpoints, one per operation.

## Solution

Create mupltiple endpoints:

- Edit task text
- Change status
- Change assignee
- Change project

## Consequences

\+ Each endpoint is simple and have one responsibility.  
\+ Clean and more readable logs.  
\- More endpoints.  
