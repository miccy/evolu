"use client";

import {
  createEvolu,
  createFormatTypeError,
  createIdFromString,
  id,
  kysely,
  MinLengthError,
  Mnemonic,
  NonEmptyString1000,
  nullOr,
  SimpleName,
  SqliteBoolean,
  ValidMutationSizeError,
} from "@evolu/common";
import {
  createUseEvolu,
  EvoluProvider,
  useAppOwner,
  useQuery,
} from "@evolu/react";
import { evoluReactWebDeps } from "@evolu/react-web";
import { IconEdit, IconStackFront, IconTrash } from "@tabler/icons-react";
import clsx from "clsx";
import { FC, Suspense, useState } from "react";

// Define the Evolu schema that describes the database tables and column types.
// First, define the typed IDs.

const ProjectId = id("Project");
type ProjectId = typeof ProjectId.Type;

const TodoId = id("Todo");
type TodoId = typeof TodoId.Type;

const Schema = {
  project: {
    id: ProjectId,
    name: NonEmptyString1000,
  },
  todo: {
    id: TodoId,
    title: NonEmptyString1000,
    // SQLite doesn't support the boolean type; it uses 0 (false) and 1 (true) instead.
    // SqliteBoolean provides seamless conversion.
    isCompleted: nullOr(SqliteBoolean),
    projectId: nullOr(ProjectId),
  },
};

const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  reloadUrl: "/playgrounds/full",
  name: SimpleName.fromOrThrow("evolu-playground-full-v2"),

  ...(process.env.NODE_ENV === "development" && {
    transports: [{ type: "WebSocket", url: "http://localhost:4000" }],
    // transports: [],
  }),

  onInit: ({ isFirst }) => {
    if (isFirst) {
      // Create a default project
      evolu.upsert("project", {
        id: createIdFromString<ProjectId>("personal-project"),
        name: "Personal",
      });
    }
  },

  // Indexes are not required for development but are recommended for production.
  // https://www.evolu.dev/docs/indexes
  indexes: (create) => [
    create("todoCreatedAt").on("todo").column("createdAt"),
    create("projectCreatedAt").on("project").column("createdAt"),
    create("todoProjectId").on("todo").column("projectId"),
  ],

  enableLogging: true,
});

const useEvolu = createUseEvolu(evolu);

const projectsQuery = evolu.createQuery(
  (db) =>
    db
      .selectFrom("project")
      .select(["id", "name"])
      .where("isDeleted", "is not", 1)
      .where("name", "is not", null)
      .$narrowType<{ name: kysely.NotNull }>()
      .orderBy("createdAt"),
  {
    // logQueryExecutionTime: true,
    // logExplainQueryPlan: true,
  },
);

const todosWithProject = evolu.createQuery(
  (db) =>
    db
      .selectFrom("todo")
      .select(["id", "title", "isCompleted", "projectId"])
      .where("isDeleted", "is not", 1)
      // Filter null value and ensure non-null type.
      .where("title", "is not", null)
      .$narrowType<{ title: kysely.NotNull }>()
      .orderBy("createdAt"),
  {
    // logQueryExecutionTime: true,
    // logExplainQueryPlan: true,
  },
);

type ProjectsRow = typeof projectsQuery.Row;
type TodosWithProjectRow = typeof todosWithProject.Row;

evolu.subscribeError(() => {
  const error = evolu.getError();
  if (!error) return;
  alert("🚨 Evolu error occurred! Check the console.");
  // eslint-disable-next-line no-console
  console.error(error);
});

export const NextJsPlaygroundFull: FC = () => {
  return (
    <div className="min-h-screen bg-white px-8 py-8">
      <div className="mx-auto max-w-md">
        <EvoluProvider value={evolu}>
          <Suspense>
            <ProjectsAndTodos />
            <OwnerActions />
          </Suspense>
        </EvoluProvider>
      </div>
    </div>
  );
};

const Button: FC<{
  title: string;
  className?: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}> = ({ title, className, onClick, variant = "secondary" }) => {
  const baseClasses =
    "px-3 py-2 text-sm font-medium rounded-md transition-colors";
  const variantClasses =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button
      className={clsx(baseClasses, variantClasses, className)}
      onClick={onClick}
    >
      {title}
    </button>
  );
};

const ProjectsAndTodos: FC = () => {
  const projects = useQuery(projectsQuery);
  const todos = useQuery(todosWithProject);
  const { insert } = useEvolu();

  const handleAddProjectClick = () => {
    const name = window.prompt("What's the project name?");
    if (name == null) return; // escape or cancel

    const result = insert("project", {
      name,
    });

    if (!result.ok) {
      alert(formatTypeError(result.error));
    }
  };

  const groupedTodos = todos.reduce<Record<string, Array<TodosWithProjectRow>>>(
    (acc, todo) => {
      const projectId = todo.projectId ?? "no-project";
      acc[projectId] = acc[projectId] ?? [];
      acc[projectId].push(todo);
      return acc;
    },
    {},
  );

  const unassignedTodos = groupedTodos["no-project"] ?? [];

  if (projects.length === 0 && unassignedTodos.length === 0) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <div className="mb-4 text-gray-700">
            <IconStackFront className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No projects yet
          </h3>
          <p className="mb-6 text-gray-500">
            Create your first project to get started
          </p>
          <Button
            title="Add Project"
            onClick={handleAddProjectClick}
            variant="primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between pb-4">
        <h1 className="text-xl font-semibold text-gray-900">Todo App</h1>
        <Button title="Add Project" onClick={handleAddProjectClick} />
      </div>

      <div className="space-y-6">
        {projects.map((project) => (
          <ProjectSection
            key={project.id}
            project={project}
            todos={groupedTodos[project.id] ?? []}
          />
        ))}

        {/* Orphaned todos (todos without a project) */}
        {unassignedTodos.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 font-medium text-gray-900">Unassigned Todos</h3>
            <div className="space-y-2">
              {unassignedTodos.map((todo) => (
                <TodoItem key={todo.id} row={todo} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectSection: FC<{
  project: ProjectsRow;
  todos: Array<TodosWithProjectRow>;
}> = ({ project, todos }) => {
  const { insert, update } = useEvolu();
  const [newTodoTitle, setNewTodoTitle] = useState("");

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;

    const result = insert("todo", {
      title: newTodoTitle.trim(),
      projectId: project.id,
    });

    if (result.ok) {
      setNewTodoTitle("");
    } else {
      alert(formatTypeError(result.error));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  const handleDeleteProject = () => {
    if (
      confirm(
        `Are you sure you want to delete project "${project.name}"? All todos in this project will be unassigned.`,
      )
    ) {
      // First, unassign all todos from this project
      todos.forEach((todo) => {
        update("todo", { id: todo.id, projectId: null });
      });

      // Then delete the project
      update("project", { id: project.id, isDeleted: true });
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{project.name}</h3>
        <button
          onClick={handleDeleteProject}
          className="p-1 text-gray-400 transition-colors hover:text-red-600"
          title="Delete Project"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>

      {todos.length > 0 && (
        <div className="mb-4 space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} row={todo} />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => {
            setNewTodoTitle(e.target.value);
          }}
          onKeyDown={handleKeyPress}
          placeholder="Add a new todo..."
          className="flex-1 border-b border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <Button title="Add" onClick={handleAddTodo} variant="primary" />
      </div>
    </div>
  );
};

const TodoItem: FC<{
  row: TodosWithProjectRow;
}> = ({ row: { id, title, isCompleted } }) => {
  const { update } = useEvolu();

  const handleToggleCompletedClick = () => {
    update("todo", { id, isCompleted: !isCompleted });
  };

  const handleRenameClick = () => {
    const newTitle = window.prompt("Edit todo", title);
    if (newTitle == null) return; // escape or cancel
    const result = update("todo", { id, title: newTitle });
    if (!result.ok) {
      alert(formatTypeError(result.error));
    }
  };

  const handleDeleteClick = () => {
    update("todo", { id, isDeleted: true });
  };

  return (
    <li className="-mx-2 flex items-center gap-3 px-2 py-2 hover:bg-gray-50">
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={!!isCompleted}
          onChange={handleToggleCompletedClick}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span
          className={clsx(
            "flex-1 text-sm",
            isCompleted ? "text-gray-500 line-through" : "text-gray-900",
          )}
        >
          {title}
        </span>
      </label>
      <div className="flex gap-1">
        <button
          onClick={handleRenameClick}
          className="p-1 text-gray-400 transition-colors hover:text-blue-600"
          title="Edit"
        >
          <IconEdit className="h-4 w-4" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-1 text-gray-400 transition-colors hover:text-red-600"
          title="Delete"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
};

const OwnerActions: FC = () => {
  const evolu = useEvolu();
  const owner = useAppOwner();
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleRestoreAppOwnerClick = () => {
    const mnemonic = window.prompt("Enter your mnemonic to restore your data:");
    if (mnemonic == null) return;
    const result = Mnemonic.from(mnemonic.trim());
    if (!result.ok) {
      alert(formatTypeError(result.error));
      return;
    }
    void evolu.restoreAppOwner(result.value);
  };

  const handleResetAppOwnerClick = () => {
    if (confirm("Are you sure? This will delete all your local data.")) {
      void evolu.resetAppOwner();
    }
  };

  const handleDownloadDatabaseClick = () => {
    void evolu.exportDatabase().then((array) => {
      const blob = new Blob([array.slice()], { type: "application/x-sqlite3" });
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = window.URL.createObjectURL(blob);
      a.download = "todos.sqlite3";
      a.addEventListener("click", function () {
        setTimeout(function () {
          window.URL.revokeObjectURL(a.href);
          a.remove();
        }, 1000);
      });
      a.click();
    });
  };

  return (
    <div className="mt-8 p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-900">
        Data Management
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Your todos are stored locally and encrypted. Use your mnemonic to sync
        across devices.
      </p>

      <div className="space-y-3">
        <Button
          title={`${showMnemonic ? "Hide" : "Show"} Mnemonic`}
          onClick={() => {
            setShowMnemonic(!showMnemonic);
          }}
          className="w-full"
        />

        {showMnemonic && owner?.mnemonic && (
          <div className="bg-gray-50 p-3">
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Your Mnemonic (keep this safe!)
            </label>
            <textarea
              value={owner.mnemonic}
              readOnly
              rows={3}
              className="w-full border-b border-gray-300 bg-white px-2 py-1 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            title="Restore from Mnemonic"
            onClick={handleRestoreAppOwnerClick}
          />
          <Button
            title="Download Backup"
            onClick={handleDownloadDatabaseClick}
          />
          <Button title="Reset All Data" onClick={handleResetAppOwnerClick} />
        </div>
      </div>
    </div>
  );
};

/**
 * The `createFormatTypeError` function creates a unified error formatter that
 * handles both Evolu Type's built-in errors and custom errors. It also lets us
 * override the default formatting for specific errors.
 *
 * If you prefer not to reuse built-in error formatters, you can write your own
 * `formatTypeError` function from scratch. See the commented-out example at
 * the end of this file.
 */
const formatTypeError = createFormatTypeError<
  ValidMutationSizeError | MinLengthError
>((error): string => {
  switch (error.type) {
    /**
     * If schema types are used correctly (e.g., maxLength), this error should
     * not occur. If it does, it indicates a developer mistake.
     */
    case "ValidMutationSize":
      return "This is a developer error, it should not happen 🤨";
    // Overrides a built-in error formatter.
    case "MinLength":
      return `Minimal length is: ${error.min}`;
  }
});

// // Note: We only need to specify the errors actually used in the app.
// type AppErrors =
//   | ValidMutationSizeError
//   | StringError
//   | MinLengthError
//   | MaxLengthError
//   | NullError
//   | IdError
//   | TrimmedError
//   | MnemonicError
//   | LiteralError
//   // Composite errors
//   | ObjectError<Record<string, AppErrors>>
//   | UnionError<AppErrors>;

// const formatTypeError: TypeErrorFormatter<AppErrors> = (error) => {
//   // In the real code, we would use the createTypeErrorFormatter helper
//   // that safely stringifies error value.
//   switch (error.type) {
//     case "Id":
//       return `Invalid Id on table: ${error.table}.`;
//     case "MaxLength":
//       return `Max length is ${error.max}.`;
//     case "MinLength":
//       return `Min length is ${error.min}.`;
//     case "Mnemonic":
//       return `Invalid mnemonic: ${String(error.value)}`;
//     case "Null":
//       return `Not null`;
//     case "String":
//       // We can reuse existing formatter.
//       return formatStringError(error);
//     case "Trimmed":
//       return "Value is not trimmed.";
//     case "ValidMutationSize":
//       return "A developer made an error, this should not happen.";
//     case "Literal":
//       return formatLiteralError(error);
//     // Composite Types
//     case "Union":
//       return `Union errors: ${error.errors.map(formatTypeError).join(", ")}`;
//     case "Object": {
//       if (
//         error.reason.kind === "ExtraKeys" ||
//         error.reason.kind === "NotObject"
//       )
//         return "A developer made an error, this should not happen.";
//       const firstError = Object.values(error.reason.errors).find(
//         (e) => e !== undefined,
//       )!;
//       return formatTypeError(firstError);
//     }
//   }
// };
