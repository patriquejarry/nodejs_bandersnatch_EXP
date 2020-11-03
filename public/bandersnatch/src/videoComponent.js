class VideoComponent {
    constructor() {
        this.modal = {}
        this.timeoutId = null
    }

    initializePlayer() {
        const player = videojs('vid');
        const ModalDialog = videojs.getComponent('ModalDialog');
        const modal = new ModalDialog(player, {
            temporary: false,
            closeable: true,
            pauseOnOpen: false
        });

        player.addChild(modal);
        player.on('play', () => modal.close())
        //player.on('ended', () => { console.log('ENDED'); window.location.href = '/' })
        this.modal = modal
    }

    configureModal(options, modalTimeout) {
        const modal = this.modal
        modal.on('modalopen', this.getModalTemplate(options, modal))
        modal.open()
        this.timeoutId = modal.setTimeout(() => {
            // In the case nothing is selected
            window.nextChunk()
        }, modalTimeout * 1000);
    }

    reset() {
        this.modal.clearTimeout(this.timeoutId)
        this.modal.close()
    }

    getModalTemplate(options, modal) {
        return (_) => {
            const [option1, option2] = options
            const htmlTemplate = `
            <div class='overlay'>
                <div class='videoButtonWrapper'>
                    <button class="btn btn-dark" onclick="window.nextChunk('${option1}')">
                        ${option1}
                    </button>
                    <button class="btn btn-dark" onclick="window.nextChunk('${option2}')">
                        ${option2}
                    </button>
                </div>
            </div>
            `
            modal.contentEl().innerHTML = htmlTemplate
        }
    }
}