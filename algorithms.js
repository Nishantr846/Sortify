const form = document.getElementById('sortForm');
const stopBtn = document.getElementById('stopBtn');
const barContainer = document.getElementById('barContainer');
const algoCode = document.getElementById('algoCode');
const inputArray = document.getElementById('inputArray');
const sizeInput = document.getElementById('size');
const speedInput = document.getElementById('speed');
const algoSelect = document.getElementById('algo');

let stopRequested = false;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));



let bars = [];

function createBars(arr) {
    barContainer.innerHTML = '';
    bars = [];
    const maxVal = Math.max(...arr);
    const barWidth = `${Math.floor(100 / arr.length)}%`;

    arr.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.width = barWidth;

        const label = document.createElement('div');
        label.classList.add('bar-label');
        bar.appendChild(label);

        barContainer.appendChild(bar);
        bars.push(bar);
    });
}

function renderBars(arr, highlightIndices = [], movingIndices = [], sortedIndices = []) {
    if (bars.length !== arr.length) {
        createBars(arr);
    }
    const maxVal = Math.max(...arr);

    arr.forEach((val, idx) => {
        const bar = bars[idx];
        bar.style.height = `${(val / maxVal) * 100}%`;
        bar.querySelector('.bar-label').textContent = val;

        bar.classList.remove('highlighted', 'moving', 'sorted');

        bar.style.backgroundColor = '';

        if (highlightIndices.includes(idx)) {
            bar.classList.add('highlighted');
            bar.style.backgroundColor = '#facc15'; // yellow
        }
        if (movingIndices.includes(idx)) {
            bar.classList.add('moving');
            bar.style.backgroundColor = '#3b82f6'; // blue
        }
        if (sortedIndices.includes(idx)) {
            bar.classList.add('sorted');
            bar.style.backgroundColor = '#22c55e'; // green
        }
    });
}

function generateRandomArray(size) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
}

function parseInput(text, size) {
    if (!text.trim()) return null;
    const parts = text.split(',').map(s => s.trim());
    if (parts.length !== size) return null;
    const nums = parts.map(Number);
    return nums.every(n => !isNaN(n)) ? nums : null;
}

function updateAlgoCode(algo) {
    algoCode.textContent = algorithms[algo]?.code || 'Algorithm code not available.';
}

const algorithms = {

    bubble: {
        code: `function bubbleSort(arr) {
      for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
      return arr;
    }`,
        sort: async (arr, speed, render) => {
            for (let i = 0; i < arr.length - 1; i++) {
                for (let j = 0; j < arr.length - i - 1; j++) {
                    if (stopRequested) return;
                    if (arr[j] > arr[j + 1]) {
                        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                        render(arr, [j, j + 1], [], [...Array(i).keys()].map(x => arr.length - 1 - x));
                        await sleep(speed);
                    } else {
                        render(arr, [], [], [...Array(i).keys()].map(x => arr.length - 1 - x));
                        await sleep(speed);
                    }
                }
            }
            render(arr, [], [], [...Array(arr.length).keys()]);
        }
    },
    selection: {
        code: `function selectionSort(arr) {
      for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[j] < arr[minIdx]) {
            minIdx = j;
          }
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      }
      return arr;
    }`,
        sort: async (arr, speed, render) => {
            const sortedIndices = [];
            for (let i = 0; i < arr.length - 1; i++) {
                let minIdx = i;
                for (let j = i + 1; j < arr.length; j++) {
                    if (stopRequested) return;
                    if (arr[j] < arr[minIdx]) minIdx = j;
                }
                if (minIdx !== i) {
                    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
                    render(arr, [i, minIdx], [], sortedIndices);
                    await sleep(speed);
                }
                sortedIndices.push(i);
            }
            sortedIndices.push(arr.length - 1);
            render(arr, [], [], sortedIndices);
        }
    },
    insertion: {
        code: `function insertionSort(arr) {
      for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
          arr[j + 1] = arr[j];
          j--;
        }
        arr[j + 1] = key;
      }
      return arr;
    }`,
        sort: async (arr, speed, render) => {
            const sortedIndices = [];
            for (let i = 1; i < arr.length; i++) {
                let key = arr[i];
                let j = i - 1;
                while (j >= 0 && arr[j] > key) {
                    if (stopRequested) return;
                    arr[j + 1] = arr[j];
                    j--;
                    render(arr, [j + 1], [], sortedIndices);
                    await sleep(speed);
                }
                arr[j + 1] = key;
                render(arr, [j + 1], [], sortedIndices);
                await sleep(speed);
                sortedIndices.push(i);
            }
            sortedIndices.push(0);
            render(arr, [], [], sortedIndices);
        }
    },
    merge: {
        code: `function mergeSort(arr) {
      if (arr.length <= 1) return arr;
      const mid = Math.floor(arr.length / 2);
      const left = mergeSort(arr.slice(0, mid));
      const right = mergeSort(arr.slice(mid));
      return merge(left, right);
    }`,
        sort: async function mergeSort(arr, speed, render) {
            const sortedIndices = [];
            async function mergeSortInner(arr, l, r) {
                if (l >= r) return;
                const m = Math.floor((l + r) / 2);
                await mergeSortInner(arr, l, m);
                await mergeSortInner(arr, m + 1, r);
                let left = arr.slice(l, m + 1);
                let right = arr.slice(m + 1, r + 1);
                let i = 0, j = 0, k = l;
                while (i < left.length && j < right.length) {
                    if (stopRequested) return;
                    if (left[i] <= right[j]) {
                        arr[k++] = left[i++];
                    } else {
                        arr[k++] = right[j++];
                    }
                    render(arr, [k - 1], [], sortedIndices);
                    await sleep(speed);
                }
                while (i < left.length) {
                    arr[k++] = left[i++];
                    render(arr, [k - 1], [], sortedIndices);
                    await sleep(speed);
                }
                while (j < right.length) {
                    arr[k++] = right[j++];
                    render(arr, [k - 1], [], sortedIndices);
                    await sleep(speed);
                }
            }
            await mergeSortInner(arr, 0, arr.length - 1);
            for (let i = 0; i < arr.length; i++) sortedIndices.push(i);
            render(arr, [], [], sortedIndices);
        }
    },
    quick: {
        code: `function quickSort(arr) {
      if (arr.length <= 1) return arr;
      const pivot = arr[arr.length - 1];
      const left = arr.filter(x => x < pivot);
      const right = arr.filter(x => x > pivot);
      return [...quickSort(left), pivot, ...quickSort(right)];
    }`,
        sort: async function quickSort(arr, speed, render) {
            const sortedIndices = [];
            async function partition(low, high) {
                let pivot = arr[high];
                let i = low - 1;
                for (let j = low; j < high; j++) {
                    if (stopRequested) return;
                    if (arr[j] < pivot) {
                        i++;
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                        render(arr, [i, j], [], sortedIndices);
                        await sleep(speed);
                    }
                }
                [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                render(arr, [i + 1, high], [], sortedIndices);
                await sleep(speed);
                return i + 1;
            }

            async function quickSortInner(low, high) {
                if (low < high) {
                    const pi = await partition(low, high);
                    await quickSortInner(low, pi - 1);
                    await quickSortInner(pi + 1, high);
                }
            }
            await quickSortInner(0, arr.length - 1);
            for (let i = 0; i < arr.length; i++) sortedIndices.push(i);
            render(arr, [], [], sortedIndices);
        }
    },
    heap: {
        code: `function heapSort(arr) {
      const heapify = (n, i) => {
        let largest = i;
        let l = 2 * i + 1;
        let r = 2 * i + 2;
        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;
        if (largest !== i) {
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          heapify(n, largest);
        }
      };
      const n = arr.length;
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
          if (stopRequested) return;
          render(arr, [], [], [...Array(arr.length - i).keys()].map(x => arr.length - 1 - x));
          [arr[0], arr[i]] = [arr[i], arr[0]];
          await sleep(speed);
          await heapify(i, 0);
      }
      render(arr, [], [], [...Array(arr.length).keys()]);
  }
    }`,
        sort: async (arr, speed, render) => {
            async function heapify(n, i) {
                let largest = i;
                let l = 2 * i + 1;
                let r = 2 * i + 2;
                if (l < n && arr[l] > arr[largest]) largest = l;
                if (r < n && arr[r] > arr[largest]) largest = r;
                if (largest !== i) {
                    [arr[i], arr[largest]] = [arr[largest], arr[i]];
                    render(arr, [i, largest]);
                    await sleep(speed);
                    await heapify(n, largest);
                }
            }

            let n = arr.length;
            for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
            for (let i = n - 1; i > 0; i--) {
                if (stopRequested) return;
                render(arr, [], [], [...Array(arr.length - i).keys()].map(x => arr.length - 1 - x));
                [arr[0], arr[i]] = [arr[i], arr[0]];
                await sleep(speed);
                await heapify(i, 0);
            }
            render(arr, [], [], [...Array(arr.length).keys()]);
        }
    },
    shell: {
        code: `function shellSort(arr) {
      for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
        for (let i = gap; i < arr.length; i++) {
          let temp = arr[i], j;
          for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
            arr[j] = arr[j - gap];
          }
          arr[j] = temp;
        }
      }
      return arr;
    }`,
        sort: async (arr, speed, render) => {
            const sortedIndices = [];
            for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
                for (let i = gap; i < arr.length; i++) {
                    let temp = arr[i];
                    let j = i;
                    while (j >= gap && arr[j - gap] > temp) {
                        if (stopRequested) return;
                        arr[j] = arr[j - gap];
                        j -= gap;
                        render(arr, [j, j + gap], [], sortedIndices);
                        await sleep(speed);
                    }
                    arr[j] = temp;
                    render(arr, [j], [], sortedIndices);
                    await sleep(speed);
                }
                for (let i = 0; i < gap; i++) sortedIndices.push(i);
            }
            render(arr, [], [], sortedIndices);
        }
    },
counting: {
        code: `function countingSort(arr) {
      const max = Math.max(...arr);
      const count = Array(max + 1).fill(0);
      arr.forEach(val => count[val]++);
      let idx = 0;
      count.forEach((c, val) => {
        while (c-- > 0) arr[idx++] = val;
      });
      return arr;
    }`,
        sort: async (arr, speed, render) => {
            const max = Math.max(...arr);
            const count = Array(max + 1).fill(0);
            for (let val of arr) count[val]++;
            let idx = 0;
            const sortedIndices = [];
            for (let i = 0; i < count.length; i++) {
                while (count[i]-- > 0) {
                    arr[idx++] = i;
                    sortedIndices.push(idx - 1);
                    render(arr, [idx - 1], [], sortedIndices);
                    await sleep(speed);
                }
            }
            render(arr, [], [], sortedIndices);
        }
    },
radix: {
        code: `function radixSort(arr) {
      const getMax = arr => Math.max(...arr);
      let exp = 1;
      while (Math.floor(getMax(arr) / exp) > 0) {
        countingSortByDigit(arr, exp);
        exp *= 10;
      }
    }`,
        sort: async (arr, speed, render) => {
            const getMax = arr => Math.max(...arr);
            const countingSortByDigit = async (arr, exp) => {
                let output = Array(arr.length).fill(0);
                let count = Array(10).fill(0);
                const sortedIndices = [];

                for (let i = 0; i < arr.length; i++) count[Math.floor(arr[i] / exp) % 10]++;

                for (let i = 1; i < 10; i++) count[i] += count[i - 1];
                for (let i = arr.length - 1; i >= 0; i--) {
                    let digit = Math.floor(arr[i] / exp) % 10;
                    output[count[digit] - 1] = arr[i];
                    count[digit]--;
                }
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = output[i];
                    sortedIndices.push(i);
                    render(arr, [i], [], sortedIndices);
                    await sleep(speed);
                }
            };

            for (let exp = 1; Math.floor(getMax(arr) / exp) > 0; exp *= 10) {
                if (stopRequested) return;
                await countingSortByDigit(arr, exp);
            }
            render(arr, [], [], [...Array(arr.length).keys()]);
        }
    },
bucket:
    {
        code: `function bucketSort(arr) {
  const buckets = Array.from({ length: 10 }, () => []);
  const max = Math.max(...arr);
  arr.forEach(num => {
    let idx = Math.floor((num / (max + 1)) * 10);
    buckets[idx].push(num);
  });
  arr = [].concat(...buckets.map(bucket => bucket.sort((a, b) => a - b)));
  return arr;
}`,
        sort: async (arr, speed, render) => {
            const buckets = Array.from({ length: 10 }, () => []);
            const max = Math.max(...arr);
            for (let i = 0; i < arr.length; i++) {
                const idx = Math.floor((arr[i] / (max + 1)) * 10);
                buckets[idx].push(arr[i]);
                render(arr, [i]);
                await sleep(speed / 2);
            }

            let index = 0;
            const sortedIndices = [];
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].sort((a, b) => a - b);
                for (let j = 0; j < buckets[i].length; j++) {
                    arr[index++] = buckets[i][j];
                    sortedIndices.push(index - 1);
                    render(arr, [index - 1], [], sortedIndices);
                    await sleep(speed);
                }
            }
            render(arr, [], [], sortedIndices);
        }
    }
};

// Form Submit: Visualize sorting
form.addEventListener('submit', async e => {
    e.preventDefault();
    stopRequested = false;

    const size = parseInt(sizeInput.value);
    if (isNaN(size) || size < 5 || size > 50) {
        alert('Size must be between 5 and 50');
        return;
    }

    let arr = parseInput(inputArray.value, size);
    if (!arr) {
        arr = generateRandomArray(size);
        inputArray.value = arr.join(', ');
    }

    const speed = 1001 - parseInt(speedInput.value);
    const algo = algoSelect.value;

    updateAlgoCode(algo);
    renderBars(arr);

    if (!algorithms[algo]?.sort) {
        alert('Sort visualization not implemented.');
        return;
    }

    await algorithms[algo].sort(arr, speed, renderBars);
});

// Stop Button
stopBtn.addEventListener('click', () => {
    stopRequested = true;
});


// Initial rendering
const defaultArray = [20, 40, 10, 70, 30];
renderBars(defaultArray);
updateAlgoCode('bubble');
