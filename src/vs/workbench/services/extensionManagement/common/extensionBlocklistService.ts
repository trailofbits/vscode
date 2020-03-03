import { Disposable } from 'vs/base/common/lifecycle';
import { IExtensionBlocklistService } from 'vs/workbench/services/extensionManagement/common/extensionManagement';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { ConfigWatcher } from 'vs/base/node/config';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import * as path from 'vs/base/common/path';

const ALLOWED_PUBLISHERS_FILE_PATH = '.vscode_allowed_extension_publishers';
const ALLOWED_PACKAGES_FILE_PATH = '.vscode_allowed_extension_packages';
const PROHIBITED_PACKAGES_FILE_PATH = '.vscode_prohibited_extension_packages';


export class ExtensionBlocklistService extends Disposable implements IExtensionBlocklistService {

	_serviceBrand: undefined;

	private _allowedPublishers: string[];
	private _allowedPackages: string[];
	private _prohibitedPackages: string[];

	allowedPublishersMonitor: ConfigWatcher<string[]>;
	allowedPackagesMonitor: ConfigWatcher<string[]>;
	prohibitedPackagesMonitor: ConfigWatcher<string[]>;

	constructor(
		@IWorkbenchEnvironmentService private readonly _environmentService: IWorkbenchEnvironmentService,
	) {
		super();
		this.allowedPublishersMonitor = this._register(new ConfigWatcher(path.join(this._environmentService.userHome,ALLOWED_PUBLISHERS_FILE_PATH), {
			changeBufferDelay: 300,
			defaultConfig: [],
			parse: (content: string, parseErrors: any[]) => content.split('\n'),
			initCallback: (content: string[]) => this._allowedPublishers = content,
			onError: (error: Error | string) => {},
		}));
		this.allowedPackagesMonitor = this._register(new ConfigWatcher(path.join(this._environmentService.userHome,ALLOWED_PACKAGES_FILE_PATH), {
			changeBufferDelay: 300,
			defaultConfig: [],
			parse: (content: string, parseErrors: any[]) => content.split('\n'),
			initCallback: (content: string[]) => this._allowedPackages = content,
			onError: (error: Error | string) => {},
		}));
		this.prohibitedPackagesMonitor = this._register(new ConfigWatcher(path.join(this._environmentService.userHome,PROHIBITED_PACKAGES_FILE_PATH), {
			changeBufferDelay: 300,
			defaultConfig: [],
			parse: (content: string, parseErrors: any[]) => content.split('\n'),
			initCallback: (content: string[]) => this._prohibitedPackages = content,
			onError: (error: Error | string) => {},
		}));

		this._allowedPublishers = this.allowedPublishersMonitor.getConfig();
		this._allowedPackages = this.allowedPackagesMonitor.getConfig();
		this._prohibitedPackages = this.prohibitedPackagesMonitor.getConfig();

		//TODO: add infra to update the lists when files change
	}

	isPermitted( extension: { publisher: string; name: string; version: string} ): boolean {
		return (this._allowedPublishers.indexOf(extension.publisher) !== -1 ||
				this._allowedPackages.indexOf(extension.publisher + '.' + extension.name) !== -1) &&
				this._prohibitedPackages.indexOf(extension.publisher + '.' + extension.name + '-' + extension.version) === -1;
	}

}

registerSingleton(IExtensionBlocklistService, ExtensionBlocklistService, true);
