/**
 * @file File utilities
 * @AI-CONTEXT This file contains utility functions for file operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { app } from 'electron';

export class FileUtils {
  private static userDataPath = app.getPath('userData');
  
  public static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
  
  public static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
  
  public static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  public static async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
  
  public static getAppDataPath(subPath: string = ''): string {
    return path.join(FileUtils.userDataPath, subPath);
  }
}
