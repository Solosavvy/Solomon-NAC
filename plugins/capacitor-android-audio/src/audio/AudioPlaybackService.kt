package com.nac.choir.plugin.audio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player

class AudioPlaybackService : Service() {

    companion object {
        const val CHANNEL_ID = "nac_audio_foreground_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.nac.choir.action.START"
        const val ACTION_PLAY = "com.nac.choir.action.PLAY"
        const val ACTION_PAUSE = "com.nac.choir.action.PAUSE"
        const val ACTION_STOP = "com.nac.choir.action.STOP"
        const val ACTION_SEEK = "com.nac.choir.action.SEEK"

        const val EXTRA_URL = "extra_audio_url"
        const val EXTRA_TITLE = "extra_audio_title"
        const val EXTRA_ARTIST = "extra_audio_artist"
        const val EXTRA_SEEK_POSITION = "extra_seek_position"
    }

    private var player: ExoPlayer? = null
    private val binder = AudioBinder()

    private var currentTitle: String = "NAC Choir Stream"
    private var currentArtist: String = "NAC Choir"
    private var currentUrl: String? = null

    inner class AudioBinder : Binder() {
        fun getService(): AudioPlaybackService = this@AudioPlaybackService
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initPlayer()
    }

    private fun initPlayer() {
        if (player == null) {
            player = ExoPlayer.Builder(applicationContext).build().apply {
                addListener(object : Player.Listener {
                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        updateNotification()
                    }

                    override fun onPlaybackStateChanged(playbackState: Int) {
                        if (playbackState == Player.STATE_ENDED) {
                            updateNotification()
                        }
                    }
                })
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_STICKY

        when (action) {
            ACTION_START -> {
                val url = intent.getStringExtra(EXTRA_URL)
                val title = intent.getStringExtra(EXTRA_TITLE) ?: "NAC Choir Stream"
                val artist = intent.getStringExtra(EXTRA_ARTIST) ?: "NAC Choir"

                if (!url.isNull_Empty()) {
                    currentUrl = url
                    currentTitle = title
                    currentArtist = artist

                    val mediaItem = MediaItem.fromUri(url)
                    player?.setMediaItem(mediaItem)
                    player?.prepare()
                    player?.playWhenReady = true
                }
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            ACTION_PLAY -> {
                player?.playWhenReady = true
                updateNotification()
            }
            ACTION_PAUSE -> {
                player?.playWhenReady = false
                updateNotification()
            }
            ACTION_STOP -> {
                player?.stop()
                stopForeground(true)
                stopSelf()
            }
            ACTION_SEEK -> {
                val pos = intent.getLongExtra(EXTRA_SEEK_POSITION, 0L)
                player?.seekTo(pos)
            }
        }

        return START_STICKY
    }

    private fun String?.isNull_Empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }

    fun play() {
        player?.playWhenReady = true
        updateNotification()
    }

    fun pause() {
        player?.playWhenReady = false
        updateNotification()
    }

    fun stop() {
        player?.stop()
        stopForeground(true)
        stopSelf()
    }

    fun seekTo(positionMs: Long) {
        player?.seekTo(positionMs)
    }

    fun isPlaying(): Boolean = player?.isPlaying ?: false

    fun getDuration(): Long = player?.duration ?: 0L

    fun getCurrentPosition(): Long = player?.currentPosition ?: 0L

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Background Audio Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "NAC Choir foreground playback controls"
                setSound(null, null)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val isPlaying = player?.isPlaying ?: false

        val playPauseIntent = Intent(this, AudioPlaybackService::class.java).apply {
            action = if (isPlaying) ACTION_PAUSE else ACTION_PLAY
        }
        val playPausePendingIntent = PendingIntent.getService(
            this,
            0,
            playPauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val stopIntent = Intent(this, AudioPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val iconRes = android.R.drawable.ic_media_play

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(iconRes)
            .setOngoing(isPlaying)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                if (isPlaying) "Pause" else "Play",
                playPausePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Stop",
                stopPendingIntent
            )
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        player?.release()
        player = null
        super.onDestroy()
    }
}
