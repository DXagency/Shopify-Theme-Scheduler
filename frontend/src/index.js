import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import enTranslations from '@shopify/polaris/locales/en.json';
import {AppProvider, Page, Layout, Frame} from '@shopify/polaris';

import AuthComponent from './components/Auth';
import Home from './components/Home';
import Header from "./components/Header";
import Stores from "./components/Stores";
import Schedules  from "./components/Schedules";

import '@shopify/polaris/build/esm/styles.css';
import '@fontsource/inter';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppProvider i18n={enTranslations}>
      <Router>
        <Frame>
          <Page>
            <Layout>
              <Layout.Section>
                <Header />
              </Layout.Section>

              <Layout.Section>
                <Routes>
                  <Route path="/" element={ <Home /> } />
                  <Route path="/login" element={ <AuthComponent mode="login" /> } />
                  <Route path="/logout" element={ <AuthComponent mode="logout" /> } />
                  <Route path="/register" element={ <AuthComponent mode="register" /> } />
                  <Route path="/stores" element={ <Stores /> } />
                  <Route path="/schedules" element={ <Schedules /> } />
                </Routes>
              </Layout.Section>
            </Layout>
          </Page>
        </Frame>
      </Router>
    </AppProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
