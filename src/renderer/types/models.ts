/**
 * @file Data model type definitions
 * @AI-CONTEXT This file contains type definitions for data models used in the application
 */

/**
 * Base note interface
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}
