<template>
    <v-dialog
        v-model="show"
        contained
        persistent
        class="overlay-score align-center justify-center"
    >
        <v-list class="rounded">
            <h2 class="text-h4 font-weight-bold d-flex text-center justify-center mt-2 mb-8">
                <img :src="`assets/img/ranking.png`" class="mr-4" width="40">
                Leaderboard
            </h2>
            <v-list-item v-for="player in this.players" :key="index">
                <template v-slot:prepend>
                    <img :src="`assets/img/balls/${player.customData.ball}`" class="mr-4" :width="GAME_BALL_WIDTH">
                    <v-list-item-title class="font-weight-bold">
                        {{ player.login }}
                    </v-list-item-title>
                </template>

                <template v-slot:append>
                    <v-list-item-title class="font-weight-bold">
                        {{ player.customData.score }} Pts
                    </v-list-item-title>
                </template>
            </v-list-item>

            <v-btn class="bg-primary mt-10 d-flex w-75 mx-auto">Back to lobby</v-btn>
            <v-btn class="mt-5 mb-5 d-flex w-75 mx-auto" color="grey-lighten-3">Back to menu</v-btn>
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

    props: ['_players', '_sceneManager'],

    setup() {
        return { GAME_BALL_WIDTH };
    },

    data() {

        return {
            show         : true,
            players      : this.$props._players,
            sceneManager : this.$props._sceneManager,
        }
    },

    async mounted() {

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
    
    .v-list-item {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
    }
}
</style>