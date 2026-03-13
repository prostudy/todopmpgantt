/**
 * Test Suite Framework
 * Framework simple para ejecutar tests unitarios
 */

const TestRunner = {
  suites: [],
  results: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  },

  registerSuite(name, tests) {
    this.suites.push({ name, tests });
  },

  async runAll() {
    this.results = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
    const startTime = performance.now();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    for (const suite of this.suites) {
      const suiteResults = await this.runSuite(suite);
      this.renderSuite(suite.name, suiteResults, resultsContainer);
    }

    this.results.duration = Math.round(performance.now() - startTime);
    this.updateStats();
  },

  async runSuite(suite) {
    const results = [];
    
    for (const test of suite.tests) {
      const result = await this.runTest(test);
      results.push(result);
      this.results.total++;
      
      if (result.status === 'pass') this.results.passed++;
      else if (result.status === 'fail') this.results.failed++;
      else if (result.status === 'skip') this.results.skipped++;
      
      this.updateProgress();
    }
    
    return results;
  },

  async runTest(test) {
    if (test.skip) {
      return { name: test.name, status: 'skip', duration: 0 };
    }

    const startTime = performance.now();
    try {
      await test.fn();
      return {
        name: test.name,
        status: 'pass',
        duration: Math.round(performance.now() - startTime),
      };
    } catch (error) {
      return {
        name: test.name,
        status: 'fail',
        duration: Math.round(performance.now() - startTime),
        error: error.message,
        stack: error.stack,
      };
    }
  },

  renderSuite(suiteName, results, container) {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    const suiteDiv = document.createElement('div');
    suiteDiv.className = 'test-group';
    
    const header = document.createElement('div');
    header.className = 'test-group-header';
    header.innerHTML = `
      <span>${suiteName}</span>
      <span>${passed}/${results.length} passed</span>
    `;
    suiteDiv.appendChild(header);
    
    results.forEach(result => {
      const testDiv = document.createElement('div');
      testDiv.className = 'test-item';
      
      testDiv.innerHTML = `
        <div class="test-name">
          ${result.name}
          <span class="test-duration">${result.duration}ms</span>
        </div>
        <span class="test-status ${result.status}">${result.status}</span>
      `;
      
      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'test-error';
        errorDiv.textContent = result.error;
        testDiv.appendChild(errorDiv);
      }
      
      suiteDiv.appendChild(testDiv);
    });
    
    container.appendChild(suiteDiv);
  },

  updateStats() {
    document.getElementById('totalTests').textContent = this.results.total;
    document.getElementById('passedTests').textContent = this.results.passed;
    document.getElementById('failedTests').textContent = this.results.failed;
    document.getElementById('duration').textContent = this.results.duration + 'ms';
  },

  updateProgress() {
    const progress = (this.results.total / this.getTotalTestCount()) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
  },

  getTotalTestCount() {
    return this.suites.reduce((sum, suite) => sum + suite.tests.length, 0);
  },
};

// Assertion helpers
const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },

  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected not to be ${expected}`);
    }
  },

  deepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Objects not equal:\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`);
    }
  },

  truthy(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },

  falsy(value, message) {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${value}`);
    }
  },

  throws(fn, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      if (e.message === (message || 'Expected function to throw')) {
        throw e;
      }
    }
  },

  arrayContains(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Array does not contain ${item}`);
    }
  },

  arrayLength(array, length, message) {
    if (array.length !== length) {
      throw new Error(message || `Expected array length ${length}, got ${array.length}`);
    }
  },

  closeTo(actual, expected, delta, message) {
    if (Math.abs(actual - expected) > delta) {
      throw new Error(message || `Expected ${actual} to be close to ${expected} (±${delta})`);
    }
  },
};
