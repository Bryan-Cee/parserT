package com.parsert

import android.content.pm.PackageManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "parserT"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    
    if (requestCode == 1001) { // SMS_PERMISSION_REQUEST_CODE
      val hasReceiveSMS = grantResults.getOrNull(0) == PackageManager.PERMISSION_GRANTED
      val hasReadSMS = grantResults.getOrNull(1) == PackageManager.PERMISSION_GRANTED
      
      // Send permission result to React Native
      val reactContext = reactNativeHost.reactInstanceManager.currentReactContext
      if (reactContext != null) {
        val params = Arguments.createMap()
        params.putBoolean("receiveSMS", hasReceiveSMS)
        params.putBoolean("readSMS", hasReadSMS)
        params.putBoolean("hasAllPermissions", hasReceiveSMS && hasReadSMS)
        
        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("onPermissionResult", params)
      }
    }
  }
}
