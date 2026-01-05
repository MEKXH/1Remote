# Electron Adaptation Checklist (from WPF Ui)

Legend: [ ] todo  [~] partial  [x] done
Priority: P0 core, P1 important, P2 nice-to-have, P3 optional

## Current Electron baseline
- Pages: sessions (index), favorites, history, network, settings
- Basic server CRUD for RDP/SSH, search, sort, view toggle, favorites

## P0 Core parity
- [x] Data source read/write (local sqlite) + load servers
  - WPF: Ui/Service/DataSource, Ui/Model/GlobalData.cs
- [x] Server list (card/list) with search, tags filter, sort, selection
  - WPF: Ui/View/ServerView/List/ServerListPageView.xaml
  - WPF: Ui/View/ServerView/List/ServerListPageViewModel.cs
- [ ] Connect / disconnect flow + session lifecycle
  - WPF: Ui/Model/ProtocolActionHelper.cs
  - WPF: Ui/View/Host/TabWindowView.xaml
- [ ] Session host window (tabbed) + reconnect/close handling
  - WPF: Ui/View/Host/TabWindowView.xaml
  - WPF: Ui/View/Host/FullScreenWindowView.xaml
- [~] Server editor basic fields + validation (RDP/SSH)
  - WPF: Ui/View/Editor/ServerEditorPageView.xaml
  - WPF: Ui/View/Editor/ServerEditorPageViewModel.cs
  - WPF: Ui/View/Editor/Forms/RdpFormView.xaml
  - WPF: Ui/View/Editor/Forms/SshFormView.xaml
- [ ] Favorites + history data persistence
  - WPF: Ui/Service/Locality/LocalityConnectRecorder.cs
  - WPF: Ui/View/ServerView/ServerListPageViewModel.cs
- [ ] General settings parity (language, startup, close behavior, logging)
  - WPF: Ui/View/Settings/General/GeneralSettingView.xaml
  - WPF: Ui/View/Settings/General/GeneralSettingViewModel.cs

## P1 Important parity
- [ ] Tree view (folders, drag reorder, custom order)
  - WPF: Ui/View/ServerView/Tree/ServerTreeView.xaml
  - WPF: Ui/View/ServerView/Tree/ServerTreeViewModel.cs
- [ ] Multi-select + bulk edit/delete actions
  - WPF: Ui/View/Editor/ServerEditorPageViewModel.cs
- [ ] Protocols beyond RDP/SSH (RDP App, VNC, SFTP, FTP, Telnet, Serial, LocalApp)
  - WPF: Ui/View/Editor/Forms/*.xaml
- [ ] Credential vault + alternative credentials
  - WPF: Ui/View/Settings/CredentialVault/CredentialVaultView.xaml
  - WPF: Ui/View/Editor/Forms/AlternativeCredential/*.xaml
- [ ] Data source configuration (MySQL, PostgreSQL)
  - WPF: Ui/View/Settings/DataSource/*.xaml
- [ ] Launcher window + global hotkey + quick connect
  - WPF: Ui/View/Launcher/LauncherWindowView.xaml
  - WPF: Ui/View/Launcher/QuickConnectionView.xaml
  - WPF: Ui/View/Settings/Launcher/LauncherSettingView.xaml
- [ ] Protocol runner settings (external runners, PuTTY, KiTTY)
  - WPF: Ui/View/Settings/ProtocolConfig/*.xaml
- [ ] Theme settings parity
  - WPF: Ui/View/Settings/Theme/ThemeSettingView.xaml

## P2 Nice-to-have
- [ ] File transfer host
  - WPF: Ui/View/Host/ProtocolHosts/FileTransmitHost.xaml
- [ ] External tools integration (arguments, data source selector, icon picker)
  - WPF: Ui/View/Editor/Forms/Argument/*.xaml
  - WPF: Ui/View/Editor/IconPopupDialogView.xaml
  - WPF: Ui/View/Editor/DataSourceSelectorView.xaml
- [ ] About / update check / request rating
  - WPF: Ui/View/AboutPageView.xaml
  - WPF: Ui/View/RequestRatingView.xaml
- [ ] Error report dialog
  - WPF: Ui/View/ErrorReport/ErrorReportWindow.xaml
- [ ] Guidance / intro screens
  - WPF: Ui/View/Guidance/*.xaml

## P3 Optional
- [ ] Custom message box / input box / processing ring parity
  - WPF: Ui/View/Utils/*.xaml
- [ ] Launcher server selections view refinements
  - WPF: Ui/View/Launcher/ServerSelectionsView.xaml

## Notes
- Keep UI look flexible; parity is functional rather than visual.
- Use this checklist to track Electron vs WPF behavior and data model alignment.
