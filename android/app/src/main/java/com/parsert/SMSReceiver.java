package com.smsparserapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.Arrays;
import java.util.List;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSReceiver";
    private static final List<String> WHITELISTED_SENDERS = Arrays.asList(
        "M-PESA", "MPESA", "Safaricom", "IM-BANK", "EQUITY", "KCB", "COOP BANK",
        "STANCHART", "ABSA", "DTB", "I&M BANK", "FAMILY BANK", "SID", "TALA"
    );

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");

                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getDisplayMessageBody();
                        long timestamp = smsMessage.getTimestampMillis();

                        Log.d(TAG, "Received SMS from: " + sender + ", Body: " + messageBody);

                        // Check if sender is in whitelist
                        if (isWhitelistedSender(sender)) {
                            Log.d(TAG, "SMS from whitelisted sender: " + sender);
                            sendEventToReactNative(context, sender, messageBody, timestamp);
                        }
                    }
                }
            }
        }
    }

    private boolean isWhitelistedSender(String sender) {
        if (sender == null) return false;

        String normalizedSender = sender.toUpperCase().trim();
        for (String whitelistedSender : WHITELISTED_SENDERS) {
            if (normalizedSender.contains(whitelistedSender.toUpperCase())) {
                return true;
            }
        }
        return false;
    }

    private void sendEventToReactNative(Context context, String sender, String body, long timestamp) {
        try {
            ReactApplication reactApplication = (ReactApplication) context.getApplicationContext();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("sender", sender);
                params.putString("body", body);
                params.putDouble("timestamp", timestamp);

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onSMSReceived", params);

                Log.d(TAG, "Event sent to React Native");
            } else {
                Log.w(TAG, "React context is null, cannot send event");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending event to React Native: " + e.getMessage());
        }
    }
}
