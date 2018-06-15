package com.peculiar;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.rnziparchive.RNZipArchivePackage;
import com.reactlibrary.RNVideoEditorPackage;
import com.brentvatne.react.ReactVideoPackage;
import cl.json.RNSharePackage;
import cl.json.ShareApplication;

import com.rnfs.RNFSPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication, ShareApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.asList(
            new MainReactPackage(),
            new RNZipArchivePackage(),
            new RNVideoEditorPackage(),
            new ReactVideoPackage(),
            new RNSharePackage(),
            new RNFSPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }

  @Override
  public String getFileProviderAuthority() {
    return getPackageName() + ".fileprovider";
  }
}
