# ADR 0001: Soft delete project

Date: 2025-09-15  
Status: Active

## Context

We want to:

- Preserve deleted entities for analysis and metrics.  
- Soft delete projects and all related entities.  
- Block access to deleted entities through the repository layer.

## Solution

1. Mark the project as deleted (field `deleted_at`).  
2. Mark all related entities (project roles, tasks, statuses) as deleted (field `deleted_at`).  
3. Keep relations between users and the deleted project.  
4. Implement deleted state validation in the repository layer:  
    - Any request to a project or its related entities checks `deleted_at IS NULL`.  
    - No need to check the project when accessing related entities, since all related entities are also marked as deleted when the project is deleted.

## Consequences

\+ Deleted projects and related entities are preserved in the database for auditing and metrics.  
\- Queries and database operations may be slightly more complex due to filtering on `deleted_at`.  
