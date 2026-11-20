package substrack.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        registerPlugin(AlarmsPlugin.class);
        registerPlugin(FileSaverPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
