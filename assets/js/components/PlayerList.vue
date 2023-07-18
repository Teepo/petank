<template>

    <v-container v-for="player in players" :key="player.id">
        <v-card :theme="player.isReady ? 'is-ready' : ''">
            <v-card-item>
                <v-card-text>
                    <v-row class="justify-space-between align-center">
                        <strong class="font-weight-bold">{{ player.login }}</strong>
                        <v-checkbox-btn
                            v-if="this.id == player.id"
                            @click="setPlayerReadyHandler"
                            :model-value="player.isReady"
                            label="Je suis prêt(e)"
                            ></v-checkbox-btn>
                        <template v-else>
                            <v-icon v-if="player.isReady" icon="mdi-check" color="green-lighten-1"></v-icon>
                            <v-icon v-else icon="mdi-close" color="red-lighten-1"></v-icon>
                            {{ player.id }}
                        </template>
                    </v-row>
                </v-card-text>
            </v-card-item>
        </v-card>
    </v-container>
</template>

<script>

import { socket } from './../modules/ws.js';

export default {

	data() {

		return {
            player  : this.$attrs.player,
			players : []
		}
	},
    
    async mounted() {

        document.querySelector('.player-list').classList.add('player-list--is-visible');

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
    methods : {

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
                player : this.player
            });

            this.player.isReady = !this.player.isReady;
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

        border: 2px solid rgb(var(--v-theme-red-lighten-1));
        transition: .2s border-color ease-in-out;

        &.v-theme {

            &--is-ready {
                border-color: rgb(var(--v-theme-green-lighten-1));
            }
        }
    }
</style>