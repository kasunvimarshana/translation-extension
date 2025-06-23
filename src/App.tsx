import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Download, 
  Settings, 
  History, 
  Languages, 
  Zap,
  FileText,
  Chrome,
  Shield,
  Star,
  Code,
  Book,
  Users,
  ArrowRight,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';

const ExtensionShowcase: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState('quick-translate');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState('');
  const [inputText, setInputText] = useState('Hello, how are you today?');
  const [copied, setCopied] = useState(false);

  // Simulate translation
  const handleTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setTranslationResult('Hola, ¿cómo estás hoy?');
      setIsTranslating(false);
    }, 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Custom Translation Engine",
      description: "Built-in translation engine with support for 20+ languages, no external APIs required"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Translation",
      description: "Real-time translation of selected text with floating translate button"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Full Page Translation",
      description: "Translate entire web pages while preserving layout and functionality"
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Translation History",
      description: "Complete history of all translations with search and export capabilities"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Advanced Settings",
      description: "Customizable preferences, shortcuts, and language preferences"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy First",
      description: "All translations processed locally, no data sent to external servers"
    }
  ];

  const extensionFiles = [
    {
      name: "manifest.json",
      size: "2.1 KB",
      description: "Extension manifest with permissions and metadata"
    },
    {
      name: "background.js",
      size: "15.3 KB", 
      description: "Service worker with custom translation engine"
    },
    {
      name: "content.js",
      size: "18.7 KB",
      description: "Content script for in-page translation features"
    },
    {
      name: "content.css",
      size: "8.2 KB",
      description: "Styles for translation UI elements"
    },
    {
      name: "popup.html",
      size: "4.1 KB",
      description: "Extension popup interface"
    },
    {
      name: "popup.js",
      size: "12.8 KB",
      description: "Popup functionality and controls"
    },
    {
      name: "popup.css",
      size: "9.6 KB",
      description: "Beautiful popup styling"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Globe className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Pure Translator
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive custom browser extension for translation built from scratch with pure JavaScript. 
              No external APIs, no dependencies - complete privacy and control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Extension
              </button>
              <button 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Star className="w-5 h-5" />
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600">Everything you need for seamless translation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
          <p className="text-lg text-gray-600">Experience the extension's capabilities</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Demo Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'quick-translate', label: 'Quick Translation', icon: <Languages className="w-4 h-4" /> },
                { id: 'page-translate', label: 'Page Translation', icon: <FileText className="w-4 h-4" /> },
                { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemo(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeDemo === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-8">
            {activeDemo === 'quick-translate' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Quick Translation</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Text (English)
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter text to translate..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">{inputText.length}/5000</span>
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isTranslating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Translating...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" />
                            Translate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Translation (Spanish)
                    </label>
                    <div className="relative">
                      <div className="w-full h-32 p-4 bg-green-50 border border-green-200 rounded-lg">
                        {translationResult ? (
                          <p className="text-green-800">{translationResult}</p>
                        ) : (
                          <p className="text-gray-400">Translation will appear here...</p>
                        )}
                      </div>
                      {translationResult && (
                        <button
                          onClick={() => handleCopy(translationResult)}
                          className="absolute top-2 right-2 p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === 'page-translate' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Page Translation</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Translate entire web pages</span>
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      Translate Page
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Original</h4>
                      <div className="bg-white p-4 rounded border text-sm">
                        <h5 className="font-semibold mb-2">Welcome to our website</h5>
                        <p>This is a sample paragraph that would be translated automatically...</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Translated</h4>
                      <div className="bg-blue-50 p-4 rounded border text-sm">
                        <h5 className="font-semibold mb-2">Bienvenido a nuestro sitio web</h5>
                        <p>Este es un párrafo de muestra que se traduciría automáticamente...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === 'history' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Translation History</h3>
                <div className="space-y-3">
                  {[
                    { original: "Hello world", translated: "Hola mundo", lang: "EN → ES", time: "2 min ago" },
                    { original: "Good morning", translated: "Bonjour", lang: "EN → FR", time: "5 min ago" },
                    { original: "Thank you", translated: "Danke", lang: "EN → DE", time: "10 min ago" }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-600 text-sm mb-1">{item.original}</p>
                          <p className="text-gray-900 font-medium">{item.translated}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {item.lang}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDemo === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-gray-700">Auto-translate selected text</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-gray-700">Show floating translate button</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-gray-700">Enable page auto-translation</span>
                    </label>
                  </div>
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default target language
                    </label>
                    <select className="w-48 p-2 border border-gray-300 rounded-lg">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Extension Files Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Extension Files</h2>
          <p className="text-lg text-gray-600">Complete source code ready for installation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {extensionFiles.map((file, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-5 h-5 text-blue-500" />
                <span className="font-mono text-sm font-semibold text-gray-900">{file.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{file.size}</span>
              </div>
              <p className="text-gray-600 text-sm">{file.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation Guide */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Installation Guide</h2>
          <p className="text-lg text-gray-600">Get started in minutes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Download Files",
              description: "Download all extension files and extract to a folder",
              icon: <Download className="w-6 h-6" />
            },
            {
              step: "2", 
              title: "Enable Developer Mode",
              description: "Go to Chrome Extensions and enable Developer Mode",
              icon: <Chrome className="w-6 h-6" />
            },
            {
              step: "3",
              title: "Load Extension",
              description: "Click 'Load unpacked' and select the extension folder",
              icon: <ExternalLink className="w-6 h-6" />
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                {step.step}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 mx-auto">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Details */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
            <p className="text-lg text-gray-600">Built with modern web technologies</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Languages Supported", value: "20+", icon: <Languages className="w-8 h-8" /> },
              { label: "Translation Speed", value: "<100ms", icon: <Zap className="w-8 h-8" /> },
              { label: "File Size", value: "71KB", icon: <FileText className="w-8 h-8" /> },
              { label: "Privacy Rating", value: "100%", icon: <Shield className="w-8 h-8" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white p-6 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white mb-4 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Pure Translator</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              A completely self-contained translation solution that respects your privacy 
              and provides professional-grade translation capabilities.
            </p>
            <div className="flex justify-center gap-6">
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Book className="w-5 h-5" />
                Documentation
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Users className="w-5 h-5" />
                Community
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExtensionShowcase;