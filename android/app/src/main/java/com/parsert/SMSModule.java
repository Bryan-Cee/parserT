package com.parsert;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class SMSModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SMSModule";
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

    @ReactMethod
    public void testSMSReceiver(Promise promise) {
        try {
            // This is a test method to verify the module is working
            promise.resolve("SMS_MODULE_ACTIVE");
        } catch (Exception e) {
            promise.reject("TEST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void readRecentSMS(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();

            // Check if we have READ_SMS permission
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "READ_SMS permission not granted");
                return;
            }

            android.database.Cursor cursor = context.getContentResolver().query(
                android.net.Uri.parse("content://sms/inbox"),
                new String[]{"address", "body", "date"},
                null,
                null,
                "date DESC LIMIT 50"
            );

            WritableMap result = Arguments.createMap();
            com.facebook.react.bridge.WritableArray messages = Arguments.createArray();

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String sender = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
                    long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow("date"));

                    WritableMap message = Arguments.createMap();
                    message.putString("sender", sender);
                    message.putString("body", body);
                    message.putDouble("timestamp", timestamp);
                    messages.pushMap(message);
                }
                cursor.close();

                result.putArray("messages", messages);
                result.putInt("count", messages.size());
                promise.resolve(result);
            } else {
                promise.reject("CURSOR_NULL", "Unable to access SMS database");
            }
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject("READ_SMS_ERROR", e.getMessage());
        }
    }
}
