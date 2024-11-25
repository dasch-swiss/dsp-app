import { Injectable } from '@angular/core';

declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements: any[]) => void;
      startup: {
        promise: Promise<any>;
        typeset: boolean;
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class MathJaxService {
  static containsLatex(text: string) {
    return text.includes('\\(');
  }

  private mathJaxLoaded?: Promise<void>;

  private mathJax: any = {
    source: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js',
  };

  public getMathJaxLoadedPromise(): Promise<void> {
    if (!this.mathJaxLoaded) {
      this.mathJaxLoaded = this.loadMathJax().catch(err => {
        console.log('MathJax failed to load', err);
      });
    }

    return this.mathJaxLoaded;
  }

  private async loadMathJax(): Promise<any> {
    return new Promise((resolve, reject) => {
      window.MathJax = {
        startup: {
          elements: null,
          typeset: false,
        },
      } as any;
      const script: HTMLScriptElement = document.createElement('script');
      script.type = 'text/javascript';
      script.src = this.mathJax.source;
      script.async = true;

      script.onload = () => {
        resolve('MathJax loaded');
      };

      script.onerror = () => {
        reject(new Error('Error loading MathJax'));
      };

      document.head.appendChild(script); // Append the script to start loading it
    });
  }

  render(element: HTMLElement) {
    window.MathJax.startup.promise.then(() => {
      window.MathJax.typesetPromise([element]);
    });
  }
}
