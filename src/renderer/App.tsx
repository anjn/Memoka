/**
 * @file Main App component
 * @AI-CONTEXT This file contains the main App component for the application
 */

import React from 'react';
import Layout from './components/Layout';
import Editor from './components/Editor';
import './App.css';

const App: React.FC = () => {
  return (
    <Layout>
      <Editor />
    </Layout>
  );
};

export default App;
