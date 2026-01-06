package com.urusdirisendiri.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        
        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }

        try {
            File file = new File(filePath);
            
            if (!file.exists()) {
                call.reject("APK file not found: " + filePath);
                return;
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // For Android 7.0 and above, use FileProvider
                apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file
                );
            } else {
                // For older versions, use file URI directly
                apkUri = Uri.fromFile(file);
            }

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            
            getContext().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
        } catch (Exception e) {
            call.reject("Failed to install APK: " + e.getMessage(), e);
        }
    }
}
