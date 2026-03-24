// Test setup for dsp-js library
import 'jest';

// Mock XMLHttpRequest for RxJS ajax
const mockXHR = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  response: null,
  responseText: '',
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  onreadystatechange: null as (() => void) | null,
  getAllResponseHeaders: jest.fn(() => ''),
  getResponseHeader: jest.fn(() => null),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

(global as any).XMLHttpRequest = jest.fn(() => mockXHR);
