class Network {
    constructor({ host }) {
        this.host = host
    }

    parseManifestURL({ url, fileResolution, fileResolutionTag, hostTag }) {
        return url.replace(fileResolutionTag, fileResolution).replace(hostTag, this.host)
    }

    async fetchFile(url) {
        const response = await fetch(url)
        return response.arrayBuffer()
    }

    async getProperResolution(url) {
        const LOWEST_RESOLUTION = 144

        const startMs = Date.now()
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const endMs = Date.now()
        const durationInMs = (endMs - startMs)

        // OR calculating throughPut as Netflix
        // const netflixThroughput = this.calcThroughput(startMs, endMs, arrayBuffer.byteLength)

        // OR calculating by download time of the smallest sample video
        const resolutions = [
            // worst case scenario, 20 seconds
            { from: 3001, to: 20000, resolution: 144 },
            // till 3 seconds
            { from: 901, to: 3000, resolution: 360 },
            // best scenario, less than 1 second
            { from: 0, to: 900, resolution: 720 },
        ]

        const item = resolutions.find(item => {
            return item.from <= durationInMs && item.to >= durationInMs
        })

        // if no resolution found
        if (!item) return LOWEST_RESOLUTION

        return item.resolution
    }

    // throughPut as Netflix
    calcThroughput(startMs, endMs, bytes) {
        const throughputKbps = (bytes * 8) / (endMs - startMs)
        return throughputKbps;
    }
}