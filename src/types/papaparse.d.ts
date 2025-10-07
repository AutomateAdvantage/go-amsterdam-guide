declare module "papaparse" {
    // minimal surface we use; keeps TS happy and tree-shakable
    export interface ParseConfig<T> {
      header?: boolean;
      skipEmptyLines?: boolean | "greedy";
      transformHeader?(header: string): string;
      complete?(results: { data: T[] }): void;
    }
    export function parse<T = any>(
      input: File | string,
      config?: ParseConfig<T>
    ): void;
  
    const Papa: { parse: typeof parse };
    export default Papa;
  }
  