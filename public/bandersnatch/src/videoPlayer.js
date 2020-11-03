class VideoMediaPlayer {
    constructor({ manifestJSON, network, videoComponent }) {
        this.manifestJSON = manifestJSON
        this.network = network
        this.videoComponent = videoComponent

        this.videoElement = null
        this.sourceBuffer = null
        this.activeItem = {}
        this.selected = {}
        this.videoDuration = 0
        this.selections = []
    }

    initializeCodec() {
        this.videoElement = document.getElementById("vid")
        const mediaSourceSupported = !!window.MediaSource
        if (!mediaSourceSupported) {
            alert('Your browser or system does not support MSE!')
            return;
        }

        const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec)
        if (!codecSupported) {
            alert(`Your browser or system does not support codec: ${this.manifestJSON.codec}`)
            return;
        }

        const mediaSource = new MediaSource()
        this.videoElement.src = URL.createObjectURL(mediaSource)

        mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource))
    }

    sourceOpenWrapper(mediaSource) {
        const INITIAL_VIDEO = this.manifestJSON.intro

        return async (_) => {
            const selected = this.selected = INITIAL_VIDEO
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec)
            mediaSource.duration = this.videoDuration // avoid running as "LIVE"
            await this.fileDownload(selected.url)
            setInterval(this.waitForQuestions.bind(this), 200)
        }
    }

    waitForQuestions() {
        const currentTime = parseInt(this.videoElement.currentTime)
        const option = this.selected.at === currentTime
        if (!option) return;

        // avoir modal been opened 2x in the same seconde
        if (this.activeItem.url === this.selected.url) return;

        const modalTimeout = this.videoDuration - this.selected.at - 2
        this.videoComponent.configureModal(this.selected.options, modalTimeout)
        this.activeItem = this.selected
    }

    async currentFileResolution() {
        const LOWEST_RESOLUTION = 144
        const prepareUrl = {
            url: this.manifestJSON.finalizar.url,
            fileResolution: LOWEST_RESOLUTION,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag,
        }
        const url = this.network.parseManifestURL(prepareUrl)
        return this.network.getProperResolution(url)
    }

    async nextChunk(data) {
        this.videoComponent.reset()
        let key = ''
        if (data) key = data.toLowerCase()
        else if (this.selected) key = this.selected.defaultOption.toLowerCase()
        const selected = this.manifestJSON[key]
        this.selected = {
            ...selected,
            // set the time modal will be opened, based on current time
            //at: parseInt(this.videoElement.currentTime + selected.at)
            at: parseInt(this.videoDuration + selected.at)
        }

        //this.manageLag(this.selected)
        // let remaining video playing while downloading the new one
        //this.videoElement.play()
        await this.fileDownload(selected.url)
    }

    manageLag(selected) {
        if (!!~this.selections.indexOf(selected.url)) {
            selected.at += 5
            return;
        }
        this.selections.push(selected.url)
    }

    async fileDownload(url) {
        const fileResolution = await this.currentFileResolution()
        const prepareUrl = {
            url,
            fileResolution,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag
        }
        const finalUrl = this.network.parseManifestURL(prepareUrl)
        this.setVideoPlayerDuration(finalUrl)
        const data = await this.network.fetchFile(finalUrl)
        return this.processBufferSegments(data)
    }

    setVideoPlayerDuration(finalURL) {
        const bars = finalURL.split('/')
        const [name, videoDuration] = bars[bars.length - 1].split('-')
        this.videoDuration += parseFloat(videoDuration)
    }

    async processBufferSegments(allSegments) {
        const sourceBuffer = this.sourceBuffer
        sourceBuffer.appendBuffer(allSegments)

        return new Promise((resolve, reject) => {
            const updateEnd = (_) => {
                sourceBuffer.removeEventListener("updateend", updateEnd)
                sourceBuffer.timestampOffset = this.videoDuration
                return resolve()
            }
            sourceBuffer.addEventListener("updateend", updateEnd)
            sourceBuffer.addEventListener("error", reject)
        })
    }
}