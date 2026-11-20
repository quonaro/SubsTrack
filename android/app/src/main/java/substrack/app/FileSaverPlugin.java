package substrack.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Writes a text file where the user points it: the system "Save as" sheet
 * (ACTION_CREATE_DOCUMENT) instead of the app sandbox. No storage permission
 * is needed — the returned content URI grants write access for one document,
 * and the user decides the folder (Downloads, Drive, a USB stick…).
 */
@CapacitorPlugin(name = "FileSaver")
public class FileSaverPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("fileName");
        String text = call.getString("text");
        if (fileName == null || fileName.isEmpty() || text == null) {
            call.reject("fileName and text are required");
            return;
        }
        String mime = call.getString("mime", "application/json");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "saveResult");
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            // Dismissing the picker is a normal outcome, not an error.
            JSObject cancelled = new JSObject();
            cancelled.put("saved", false);
            call.resolve(cancelled);
            return;
        }

        String text = call.getString("text");
        try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
            if (out == null) throw new IllegalStateException("no output stream");
            out.write(text.getBytes(StandardCharsets.UTF_8));
            out.flush();
        } catch (Exception e) {
            call.reject("Не удалось записать файл: " + e.getMessage(), e);
            return;
        }

        JSObject saved = new JSObject();
        saved.put("saved", true);
        saved.put("uri", uri.toString());
        call.resolve(saved);
    }
}
