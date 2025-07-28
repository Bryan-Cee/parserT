package com.parsert;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class SMSModule extends ReactContextBaseJavaModule {
    private static final int SMS_PERMISSION_REQUEST_CODE = 1001;
    private static final String[] SMS_PERMISSIONS = {
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_SMS
    };

    public SMSModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SMSModule";
    }

    @ReactMethod
    public void checkPermissions(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            boolean hasReceiveSMS = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
            boolean hasReadSMS = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;

            WritableMap result = Arguments.createMap();
            result.putBoolean("receiveSMS", hasReceiveSMS);
            result.putBoolean("readSMS", hasReadSMS);
            result.putBoolean("hasAllPermissions", hasReceiveSMS && hasReadSMS);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available");
                return;
            }

            ReactApplicationContext context = getReactApplicationContext();
            boolean hasReceiveSMS = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
            boolean hasReadSMS = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;

            if (hasReceiveSMS && hasReadSMS) {
                promise.resolve("ALREADY_GRANTED");
                return;
            }

            ActivityCompat.requestPermissions(currentActivity, SMS_PERMISSIONS, SMS_PERMISSION_REQUEST_CODE);
            promise.resolve("REQUESTED");
        } catch (Exception e) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }
}
