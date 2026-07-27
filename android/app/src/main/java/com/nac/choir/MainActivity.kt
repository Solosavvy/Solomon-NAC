package com.nac.choir

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.nac.choir.plugin.CapacitorAudioPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        registerPlugin(CapacitorAudioPlugin::class.java)
    }
}
