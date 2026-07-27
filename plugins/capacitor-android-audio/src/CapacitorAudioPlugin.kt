package com.nac.choir.plugin

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.nac.choir.plugin.audio.AudioPlaybackService

@CapacitorPlugin(name = "NacAudio")
class CapacitorAudioPlugin : Plugin() {

    private var audioService: AudioPlaybackService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as AudioPlaybackService.AudioBinder
            audioService = binder.getService()
            isBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            audioService = null
            isBound = false
        }
    }

    override fun load() {
        super.load()
        bindAudioService()
    }

    private fun bindAudioService() {
        val context = context ?: return
        val intent = Intent(context, AudioPlaybackService::class.java)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    @PluginMethod
    fun start(call: PluginCall) {
        val url = call.getString("url")
        if (url == null) {
            call.reject("URL parameter is required")
            return
        }

        val title = call.getString("title", "NAC Choir Stream")
        val artist = call.getString("artist", "NAC Choir")

        val context = context ?: run {
            call.reject("Context is null")
            return
        }

        val intent = Intent(context, AudioPlaybackService::class.java).apply {
            action = AudioPlaybackService.ACTION_START
            putExtra(AudioPlaybackService.EXTRA_URL, url)
            putExtra(AudioPlaybackService.EXTRA_TITLE, title)
            putExtra(AudioPlaybackService.EXTRA_ARTIST, artist)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }

        if (!isBound) {
            bindAudioService()
        }

        val ret = JSObject()
        ret.put("status", "started")
        call.resolve(ret)
    }

    @PluginMethod
    fun play(call: PluginCall) {
        val context = context ?: run {
            call.reject("Context is null")
            return
        }

        val intent = Intent(context, AudioPlaybackService::class.java).apply {
            action = AudioPlaybackService.ACTION_PLAY
        }
        context.startService(intent)

        audioService?.play()

        val ret = JSObject()
        ret.put("status", "playing")
        call.resolve(ret)
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        val context = context ?: run {
            call.reject("Context is null")
            return
        }

        val intent = Intent(context, AudioPlaybackService::class.java).apply {
            action = AudioPlaybackService.ACTION_PAUSE
        }
        context.startService(intent)

        audioService?.pause()

        val ret = JSObject()
        ret.put("status", "paused")
        call.resolve(ret)
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val context = context ?: run {
            call.reject("Context is null")
            return
        }

        val intent = Intent(context, AudioPlaybackService::class.java).apply {
            action = AudioPlaybackService.ACTION_STOP
        }
        context.startService(intent)

        audioService?.stop()

        val ret = JSObject()
        ret.put("status", "stopped")
        call.resolve(ret)
    }

    @PluginMethod
    fun seekTo(call: PluginCall) {
        val positionMs = call.getLong("positionMs", 0L) ?: 0L
        audioService?.seekTo(positionMs)

        val ret = JSObject()
        ret.put("positionMs", positionMs)
        call.resolve(ret)
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        val ret = JSObject()
        val isPlaying = audioService?.isPlaying() ?: false
        val duration = audioService?.getDuration() ?: 0L
        val currentPosition = audioService?.getCurrentPosition() ?: 0L

        ret.put("isPlaying", isPlaying)
        ret.put("duration", duration)
        ret.put("currentPosition", currentPosition)
        call.resolve(ret)
    }

    override fun handleOnDestroy() {
        if (isBound) {
            context?.unbindService(serviceConnection)
            isBound = false
        }
        super.handleOnDestroy()
    }
}
