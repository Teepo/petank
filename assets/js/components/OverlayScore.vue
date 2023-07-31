<template>
    <v-dialog
        v-model="show"
        contained
        persistent
        class="overlay-score align-center justify-center"
    >
        <v-list class="rounded">

            <v-btn icon @click="show = false" class="overlay-score-close">
                <v-icon>mdi-close</v-icon>
            </v-btn>

            <h2 class="text-h5 font-weight-bold d-flex text-center justify-center align-center mt-2 mb-5">
                <img :src="`assets/img/ranking.png`" class="mr-4" width="40">
                Leaderboard
            </h2>
            <v-list-item v-for="(player, index) in this.players" :key="player.id">
                <template v-slot:prepend>
                    <img :src="`assets/img/balls/${player.customData.ball}`" class="mr-4" :width="GAME_BALL_WIDTH">
                    <v-list-item-title class="font-weight-bold">
                        {{ player.login }}
                    </v-list-item-title>
                </template>

                <template v-slot:append>
                    <v-list-item-title class="font-weight-bold overlay-score-points">
                        <img :src="`assets/img/gold-medal.svg`"   class="mr-1" v-if="end && index === 0" width="32">
                        <img :src="`assets/img/silver-medal.svg`" class="mr-1" v-if="end && index === 1" width="32">
                        <img :src="`assets/img/bronze-medal.svg`" class="mr-1" v-if="end && index === 2" width="32">
                        {{ player.customData.score }} Pts
                    </v-list-item-title>
                </template>
            </v-list-item>

            <template v-if="end">
                <v-btn class="bg-primary mt-10 d-flex w-75 mx-auto">Back to lobby</v-btn>
                <v-btn class="mt-5 mb-5 d-flex w-75 mx-auto" color="grey-lighten-3">Back to menu</v-btn>
            </template>
        </v-list>
    </v-dialog>
</template>

<script>

import {
    WAITING_MULTIPLAYER_MODE,
    WAITING_ONEPLAYER_MODE,
    WAITING_TRAINIG_MODE,
    GAME_BALL_WIDTH
} from '../config';

import { socket } from './../modules/ws.js';

export default {

    props: ['_players', '_sceneManager', '_end'],

    setup() {
        return { GAME_BALL_WIDTH };
    },

    data() {

        return {
            show         : true,
            end          : this.$props._end ?? false,
            players      : this.$props._players,
            sceneManager : this.$props._sceneManager,
        }
    },

    async mounted() {

        // sort players by score
        this.players = this.players.slice().sort((oldPlayer, newPlayer) => newPlayer.customData.score - oldPlayer.customData.score);

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

            socket.on('start', () => {
                socket.removeAllListeners();
                document.querySelector('.player-list').remove();
                this.sceneManager.stop('waitingRoom');
                this.sceneManager.start('multiPlayer', {
                    players           : this.players,
                    isMultiplayerMode : true
                });
            });

            socket.on('getAllPlayersFromRoom', data => {
                this.handleGetAllPlayersFromRoom(data);
            });
        },

        handleGetAllPlayersFromRoom(data) {

            const { players } = data;

            players.map(player => {
                this.players.set(player.id, player);
            });
        },

        isMultiplayer() {
            return this.mode === WAITING_MULTIPLAYER_MODE;
        },

        isOneplayer() {
            return this.mode === WAITING_ONEPLAYER_MODE;
        },

        isTraining() {
            return this.mode === WAITING_TRAINIG_MODE;
        },
    }
}
</script>

<style lang="scss">
.overlay-score {

    &-close {
        position: absolute;
        top: -20px;
        right: -20px;
    }

    &-points {
        display: flex;
        align-items: center;
    }

    .v-list {

        overflow: initial;

        &-item {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;

            &:last-child {
                border-bottom: none;
            }
        }
    }
}
</style>