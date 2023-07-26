<template>
    <v-container class="mt-16">
        <v-container v-for="(player, index) in players" :key="player.id">
            <v-card :theme="player.isReady ? 'is-ready' : 'is-not-ready'">
                <v-card-item>
                    <v-card-text>
                        <v-row class="align-center" no-gutters>

                            <v-col cols="8">
                                <v-row class="align-center">
                                    <img :src="`assets/img/balls/${player.customData.ball}`" class="mr-5" :width="GAME_BALL_WIDTH" @click="showOverlayBall(player)">
                                    <strong class="font-weight-bold">
                                        {{ player.login }}
                                    </strong>
                                </v-row>
                            </v-col>

                            <v-col cols="4" class="player-list-status">
                                <v-checkbox-btn
                                    v-if="this.isMultiplayer() && this.id == player.id"
                                    @click="setPlayerReadyHandler"
                                    :model-value="player.isReady"
                                    label="I'm ready"
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
            <v-btn class="bg-primary mt-10" block @click="startOnePlayerMode">START</v-btn>
            <v-btn class="mt-5" block @click="back" color="grey-lighten-3">CANCEL</v-btn>
        </v-container>

        <v-container v-if="this.isMultiplayer()">
            <v-btn class="bg-red mt-10" block @click="leaveTheRoom">LEAVE THE ROOM</v-btn>
        </v-container>
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
            players      : this.$props._players ?? [],
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

            socket.emit('getAllPlayersFromRoom', {
                roomName : this.room
            });
            socket.on('getAllPlayersFromRoom', data => {
                this.handleGetAllPlayersFromRoom(data);
            });

            socket.on('joinedRoom', data => {
                this.handleJoinedRoom(data);
            });

            socket.on('setPlayerIsReady', data => {

                const { player } = data;

                this.players.find(p => p.id == player.id).isReady = player.isReady;
            });

            socket.on('addedPlayerCustomData', () => {
                socket.emit('getAllPlayersFromRoom', {
                    roomName : this.room
                });
            });

            socket.on('leavedRoom', data => {

                const { id } = data;

                const index = this.players.findIndex(p => p.id == id);

                if (index === -1) {
                    return;
                }

                this.players.splice(index, 1);
            });

            socket.on('deletedPlayer', data => {

                const { id } = data;

                // kick mode
                if (this.id === id) {
                    return this.back();
                }

                const index = this.players.findIndex(p => p.id == id);

                if (index === -1) {
                    return;
                }

                this.players.splice(index, 1);
            });
        },

        startOnePlayerMode() {

            this.sceneManager.stop('waitingRoom');
            this.sceneManager.start('onePlayer', {
                players : this.players
            });

            document.querySelector('.player-list').innerHTML = '';
        },

        back() {

            sessionStorage.clear();

            this.sceneManager.stop('waitingRoom');
            this.sceneManager.start('home');

            document.querySelector('.player-list').innerHTML = '';
        },

        leaveTheRoom() {

            socket.emit('leaveRoom', {
                id       : this.id,
                roomName : this.room
            });

            this.back();
        },

		handleGetAllPlayersFromRoom(data) {
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

            player.customData.ball = ballName;

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

        &-status {
            display: flex;
            justify-content: end;
        }
    }

    .v-card {

        &-item {
            height: 60px;
        }

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

        .v-card {

            &-item {
                height: auto;
            }

            &-text {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
            }
        }
    }

    .v-col .v-label {
        font-size: .85rem;
    }
</style>