const $FileInput = document.querySelector('input[type="file"]') as HTMLInputElement
const $ColorPreview = document.querySelector('div#color-preview') as HTMLDivElement
const canvas = document.createElement('canvas');
const preview = document.createElement('img');
const ctx = canvas.getContext('2d');
let imageData: Vec3[];

$FileInput.addEventListener('change', (event) => {
    let file: File = $FileInput.files[0];
    let reader = new FileReader();
    
    reader.addEventListener('loadend', () => {
        const url = reader.result.toString();
        preview.src = url;
        preview.onload = () => {
            let clusters = calculateMeanColors()
            $ColorPreview.innerHTML = ""
            clusters.forEach((clust) => {
                let swatch = document.createElement('div')
                swatch.classList.add('swatch')
                // console.log({clust})
                swatch.style.background = _toHex(clust)
                $ColorPreview.append(swatch)
            })
        };
    })

    if(file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = ""
    }
});
function _toHex(vec: Vec3) {
    let r = vec[0].toString(16)
    let g = vec[1].toString(16)
    let b = vec[2].toString(16)
    if(r.length === 1) r = "0" + r
    if(g.length === 1) g = "0" + g
    if(b.length === 1) b = "0" + b
    let hex = "#" + r + g + b
    // console.log({hexNum: hex})
    return hex;
}

document.body.append(preview)
type Vec3 = [number, number, number]
function imageToVectors(imageData: Uint8ClampedArray): Vec3[] {
    let output = []
    for(let i = 0; i < imageData.length; i+=4) {
        output.push([imageData[i], imageData[i+1], imageData[i+2]])
    }
    return output;
}

const MAX_ITERS = 50;
function calculateMeanColors() {
    ctx.drawImage(preview, 0, 0);
    let data = ctx.getImageData(0, 0, preview.width, preview.height);
    imageData = imageToVectors(data.data);
    let k = 4;
    let clusters: Vec3[][];
    let centroids = _genCentroids(k, imageData)
    let old_centroids = centroids;

    for(let i = 0; i < MAX_ITERS; i++) {
        clusters = _genClusters(k)
        for(let i = 0; i < imageData.length; i++) {
            let v = imageData[i];
            let minDist = 99999;
            let index = 0;
            for(let cIndex = 0; cIndex < k; cIndex++) {
                let centroid = centroids[cIndex];
                let dist = _calcDist(v, centroid)
                if(dist < minDist) {
                    minDist = dist;
                    index = cIndex;
                }
            }
            clusters[index].push(v);
        }
        centroids = centroids.map((old_c, i) => {
            let cluster = clusters[i]
            if(cluster.length === 0) {
                return _getRandom(imageData)
            } else {
                let mean = _calculateMean(cluster)
                // console.log({mean, old_c})
                return mean;
            }
        })
        if(arraysEqual(old_centroids, centroids)) {
            return clusters.map(c => {
                return _calculateFlooredMean(c)
            });
        }
    }

    return clusters.map(c => {
        return _calculateFlooredMean(c)
    });
}

function _getRandom<T>(list: T[]) {
    let index = Math.floor(Math.random() * list.length);
    return list[index]
}
function _genClusters(k: number) {
    let output: Vec3[][] = []
    for(let i = 0; i < k; i++) { output.push([]) }
    return output;
}
function _genCentroids<T>(k: number, array: T[]) {
    let output = []
    for(let i = 0; i < k; i++) {
        output.push(_getRandom(array))
    }
    return output;
}
function arraysEqual<T>(a1: T[], a2: T[]) {
    if(a1.length !== a2.length) return false
}

function _calcDist(v1: Vec3, v2: Vec3) {
    let dist = 0;
    for(let i = 0; i < 3; i++) {
        dist += Math.abs(v1[i] - v2[i])
    }
    return dist;
}

function _calculateMean(list: Vec3[]): Vec3 {
    let output: Vec3 = [0, 0, 0];
    for(let i = 0; i < list.length; i++) {
        output[0] += list[i][0]
        output[1] += list[i][1]
        output[2] += list[i][2]
    }
    output[0] /= list.length;
    output[1] /= list.length;
    output[2] /= list.length;
    return output;
}

function _calculateFlooredMean(list: Vec3[]) {
    let output = _calculateMean(list);
    for(let i = 0; i < list.length; i++) {
        output[i] = Math.floor(output[i])
    }
    return output;
}