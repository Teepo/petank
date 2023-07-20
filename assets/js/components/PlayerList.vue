<template>
    <v-container v-for="(player, index) in players" :key="player.id">
        <v-card :theme="player.isReady ? 'is-ready' : 'is-not-ready'">
            <v-card-item>
                <v-card-text>
                    <v-row class="align-center">

                        <v-col cols="10">
                            <v-row class="align-center">
                                <img :src="`assets/img/balls/${player.ball}`" class="mr-5" :width="GAME_BALL_WIDTH" @click="showOverlayBall(player)">
                                <strong class="font-weight-bold">
                                    {{ player.login }}
                                </strong>
                            </v-row>
                        </v-col>

                        <v-col cols="2">
                            <v-checkbox-btn
                                v-if="this.isMultiplayer() && this.id == player.id"
                                @click="setPlayerReadyHandler"
                                :model-value="player.isReady"
                                label="Je suis prêt(e)"
                                ></v-checkbox-btn>
                            <template v-else-if="this.isOneplayer()">
                                <v-icon icon="mdi-check" color="green-lighten-1"></v-icon>
                            </template>
                            <template v-else-if="this.isMultiplayer()">
                                <v-icon v-if="player.isReady" icon="mdi-check" color="green-lighten-1"></v-icon>
                                <v-icon v-else icon="mdi-close" color="red-lighten-1"></v-icon>
                            </template>
                        </v-col>

                    </v-row>
                </v-card-text>
            </v-card-item>
        </v-card>

        <v-dialog
            v-model="player.shouldDisplayOverlayBalls"
            contained
            class="align-center justify-center"
        >
            <v-card>
                <v-card-item>
                    <v-card-text>
                        <template v-for="image in this.ballsImages">
                            <img :src="image" :width="GAME_BALL_WIDTH" @click="selectBallImage(player, this.getFileNameAndExtension(image))">
                        </template>
                    </v-card-text>
                </v-card-item>
            </v-card>
        </v-dialog>
    </v-container>

    <v-container v-if="this.isOneplayer()">
        <v-btn class="bg-primary" block @click="startOnePlayerMode">START</v-btn>
    </v-container>
</template>

<script>

import {
    WAITING_MULTIPLAYER_MODE,
    WAITING_ONEPLAYER_MODE,
    GAME_BALL_WIDTH
} from '../config';

import { socket } from './../modules/ws.js';

export default {

    props: ['_player', '_players', '_mode', '_sceneManager'],

    setup() {
        return { GAME_BALL_WIDTH };
    },

    data() {

        return {
            player       : this.$props._player,
            players      : this.$props._players,
            mode         : this.$props._mode,
            sceneManager : this.$props._sceneManager,
            ballsImages  : [],

            shouldDisplayOverlayBalls : false,
        }
    },

    async created() {

        const images = [];

        const ballsFiles = import.meta.glob('./../../img/balls/*');
        for (const path in ballsFiles) {
            images.push((await ballsFiles[path]()).default);
        }

        this.ballsImages = images;
    },
    
    async mounted() {

        document.querySelector('.player-list').classList.add('player-list--is-visible');

        if (this.isMultiplayer()) {
            this.initMultiplayerMode();
        }
    },
    methods : {

        initMultiplayerMode() {

            this.id   = sessionStorage.getItem('id');
            this.room = sessionStorage.getItem('room');

            socket.emit('getAllPlayers');
            socket.on('getAllPlayers', data => {
                this.handleGetAllPlayers(data);
            });

            socket.on('joinedRoom', data => {
                this.handleJoinedRoom(data);
            });

            socket.on('setPlayerIsReady', data => {

                const { player } = data;

                this.players.find(p => p.id == player.id).isReady = player.isReady;
            });
        },

        startOnePlayerMode() {
            document.querySelector('.player-list').remove();
            this.sceneManager.stop('waitingRoom');
            this.sceneManager.start('onePlayer', {
                players : this.players
            });
        },

		handleGetAllPlayers(data) {
			const { players } = data;
			this.players = players;
		},

        handleJoinedRoom(data) {
			const { player } = data;
			this.players.push(player);
        },

        setPlayerReadyHandler() {

            socket.emit('setPlayerIsReady', {
                player   : this.player,
                roomName : this.room
            });

            this.player.isReady = !this.player.isReady;
        },

        showOverlayBall(player) {
            player.shouldDisplayOverlayBalls = true;
        },

        selectBallImage(player, ballName) {

            if (this.isOneplayer()) {
                player.ball = ballName;
            }

            if (this.isMultiplayer()) {

            }

            player.shouldDisplayOverlayBalls = false;
        },

        isMultiplayer() {
            return this.mode === WAITING_MULTIPLAYER_MODE;
        },

        isOneplayer() {
            return this.mode === WAITING_ONEPLAYER_MODE;
        },

        getFileNameAndExtension(path) {

            const segments = path.split('/');

            const fileNameWithExtension = segments[segments.length - 1];

            const fileNameSegments = fileNameWithExtension.split('.');
            const fileName = fileNameSegments[0];
            const fileExtension = fileNameSegments.length > 1 ? fileNameSegments[1] : '';

            return `${fileName}.${fileExtension}`;
        }
    }
}
</script>

<style lang="scss">
    .player-list {
        display: none;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        flex-wrap: wrap;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        &--is-visible {
            display: flex;
        }
    }

    .v-card {

        &.v-theme {

            &--is-ready {
                border: 2px solid rgb(var(--v-theme-green-lighten-1));
            }

            &--is-not-ready {
                border: 2px solid rgb(var(--v-theme-red-lighten-1));
            }
        }
    }

    .v-overlay {

        .v-card-text {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
        }
    }
</style>