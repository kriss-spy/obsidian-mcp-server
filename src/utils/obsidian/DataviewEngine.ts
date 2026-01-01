import { NoteMetadata } from "./VaultIndexer.js";

export type QueryType = "LIST" | "TABLE" | "TASK";

export interface DataviewQuery {
  type: QueryType;
  fields?: string[]; // For TABLE
  from?: string;
  where?: WhereClause;
  sort?: { field: string; direction: "ASC" | "DESC" }[];
  limit?: number;
  groupBy?: string;
}

export type WhereOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains";

export interface WhereClause {
  field?: string;
  operator?: WhereOperator;
  value?: any;
  and?: WhereClause[];
  or?: WhereClause[];
  not?: WhereClause;
}

/**
 * Simplified Dataview query engine.
 */
export class DataviewEngine {
  /**
   * Parses a Dataview query string into a structured query object.
   * @param queryText The Dataview query text.
   * @returns Structured query.
   */
  public parse(queryText: string): DataviewQuery {
    const lines = queryText.trim().split(/\n/);
    const firstLine = lines[0].trim();

    let type: QueryType = "LIST";
    let fields: string[] = [];

    if (firstLine.startsWith("TABLE")) {
      type = "TABLE";
      fields = firstLine
        .slice(5)
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f !== "");
    } else if (firstLine.startsWith("LIST")) {
      type = "LIST";
    } else if (firstLine.startsWith("TASK")) {
      type = "TASK";
    }

    const query: DataviewQuery = { type, fields };

    const fullText = lines.join(" ");

    // Simple regex-based parsing for other clauses
    const fromMatch = fullText.match(/FROM\s+"([^"]*)"/i);
    if (fromMatch) query.from = fromMatch[1];

    const sortMatch = fullText.match(/SORT\s+([^\s]+)\s+(ASC|DESC)/i);
    if (sortMatch) {
      query.sort = [
        {
          field: sortMatch[1],
          direction: sortMatch[2].toUpperCase() as "ASC" | "DESC",
        },
      ];
    }

    const limitMatch = fullText.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) query.limit = parseInt(limitMatch[1], 10);

    // WHERE clause parsing is complex, using a simplified approach for now
    const whereMatch = fullText.match(
      /WHERE\s+(.+?)(?:SORT|LIMIT|GROUP BY|$)/i,
    );
    if (whereMatch) {
      query.where = this.parseWhere(whereMatch[1].trim());
    }

    return query;
  }

  private parseWhere(whereText: string): WhereClause {
    // Very simple parser for "(a AND b) OR c" or "contains(field, value)"
    // For now, let's just support basic "field = value" and "contains(field, value)"

    if (whereText.includes(" OR ")) {
      return {
        or: whereText.split(" OR ").map((p) => this.parseWhere(p.trim())),
      };
    }

    if (whereText.includes(" AND ")) {
      return {
        and: whereText.split(" AND ").map((p) => this.parseWhere(p.trim())),
      };
    }

    // Handle contains(field, value)
    const containsMatch = whereText.match(/contains\(([^,]+),\s*([^)]+)\)/i);
    if (containsMatch) {
      return {
        field: containsMatch[1].trim(),
        operator: "contains",
        value: containsMatch[2].trim().replace(/^["']|["']$/g, ""),
      };
    }

    // Handle field = value
    const eqMatch = whereText.match(/([^\s!=><]+)\s*(=|!=|>=|<=|>|<)\s*(.+)/i);
    if (eqMatch) {
      return {
        field: eqMatch[1].trim(),
        operator: eqMatch[2] as WhereOperator,
        value: eqMatch[3].trim().replace(/^["']|["']$/g, ""),
      };
    }

    // Handle simple truthiness check
    return {
      field: whereText.trim(),
      operator: "!=",
      value: undefined,
    };
  }

  /**
   * Executes a query against a list of notes.
   */
  public execute(query: DataviewQuery, notes: NoteMetadata[]): any[] {
    let results = notes;

    // 1. FROM filter
    if (query.from) {
      results = results.filter((n) => n.path.startsWith(query.from!));
    }

    // 2. WHERE filter
    if (query.where) {
      results = results.filter((n) => this.evaluateWhere(query.where!, n));
    }

    // 3. SORT
    if (query.sort) {
      results.sort((a, b) => {
        for (const s of query.sort!) {
          const valA = a.fields[s.field] ?? "";
          const valB = b.fields[s.field] ?? "";
          if (valA < valB) return s.direction === "ASC" ? -1 : 1;
          if (valA > valB) return s.direction === "ASC" ? 1 : -1;
        }
        return 0;
      });
    }

    // 4. LIMIT
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    // 5. Format output
    if (query.type === "TABLE") {
      return results.map((n) => {
        const row: any = { file: n.path };
        query.fields?.forEach((f) => {
          row[f] = n.fields[f];
        });
        return row;
      });
    }

    return results.map((n) => n.path);
  }

  private evaluateWhere(where: WhereClause, note: NoteMetadata): boolean {
    if (where.and) return where.and.every((w) => this.evaluateWhere(w, note));
    if (where.or) return where.or.some((w) => this.evaluateWhere(w, note));
    if (where.not) return !this.evaluateWhere(where.not, note);

    const { field, operator, value } = where;
    if (!field) return true;

    const noteValue = note.fields[field];

    switch (operator) {
      case "=":
        return noteValue == value;
      case "!=":
        return noteValue != value;
      case ">":
        return noteValue > value;
      case "<":
        return noteValue < value;
      case ">=":
        return noteValue >= value;
      case "<=":
        return noteValue <= value;
      case "contains":
        if (Array.isArray(noteValue)) return noteValue.includes(value);
        if (typeof noteValue === "string") return noteValue.includes(value);
        return false;
      default:
        return !!noteValue;
    }
  }
}
