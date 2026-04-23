// Define a simple interface for anything that can be "closed"
export interface ClosableServer {
  close: (callback?: (err?: Error) => void) => void;
}
