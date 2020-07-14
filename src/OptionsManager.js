class OptionsManager {
  constructor () {
    this.dataSetPending = false
  }

  async initializeStorage (language) {
    var localData = await browser.storage.local.get()
    var modificationsNecessary = false

    const defaultOptions = {
      version: '1.2',
      profile: 0,
      language: language,
      profiles: [{ id: 0, name: 'Default Profile' }]
    }

    for (const optionName in defaultOptions) {
      if (localData[optionName] === undefined) {
        localData[optionName] = defaultOptions[optionName]
        modificationsNecessary = true
      }
    }

    for (const profile of localData.profiles) {
      var optionsKey = profile.id + '/options'
      if (localData[optionsKey] === undefined) {
        localData[optionsKey] = OptionsManager.DefaultProfileOptions
        modificationsNecessary = true
      } else {
        for (var optionName in OptionsManager.DefaultProfileOptions) {
          if (localData[optionsKey][optionName] === undefined) {
            localData[optionsKey][optionName] =
              OptionsManager.DefaultProfileOptions[optionName]
            modificationsNecessary = true
          }
        }
      }
    }

    if (modificationsNecessary) {
      return await this.safeLocalStorageSet(localData)
    }
  }

  addOnChangeProfileListener (listener) {
    browser.storage.onChanged.addListener((changes, storageAreaName) => {
      if (storageAreaName === 'local') {
        if (changes.profile !== undefined) {
          if (changes.profile.newValue !== changes.profile.oldValue) {
            listener(changes.profile.newValue)
          }
        }
      }
    })
  }

  async getOptions () {
    var localData = await browser.storage.local.get()
    var id = await this.getCurrentProfileId()
    var options = localData[id + '/options']
    return options
  }

  async getGlobalOptions () {
    var localData = await browser.storage.local.get()
    var publicOptions = {}
    for (const optionName in localData) {
      if (OptionsManager.PublicGlobalOptions.includes(optionName)) {
        publicOptions[optionName] = localData[optionName]
      }
    }
    return publicOptions
  }

  async getCurrentProfileId () {
    var localData = await browser.storage.local.get()
    return localData.profile
  }

  async getProfileName (id) {
    var localData = await browser.storage.local.get()
    var profiles = localData.profiles
    var filteredProfiles = profiles.filter(profile => profile.id === id)
    if (filteredProfiles.length === 0) {
      return null
    } else {
      return filteredProfiles[0].name
    }
  }

  async getProfiles () {
    var localData = await browser.storage.local.get()
    return localData.profiles
  }

  async setOptions (valuesToSet) {
    if (this.dataSetPending) {
      throw new Error(
        `Attempted to call OptionsManager.setOption() while data set was still pending.
				Due to the way localStorage works, you must wait for the previous set to complete
				before setting again.`
      )
    }

    var localData = await browser.storage.local.get()
    var profileId = localData.profile

    if (profileId === null) {
      throw new Error(
        'Attempted to set options while not logged into a profile.'
      )
    }

    var currentOptions = localData[profileId + '/options']
    var modifiedOptions = Object.assign({}, currentOptions, valuesToSet)
    var dataToSet = {}
    dataToSet[profileId + '/options'] = modifiedOptions
    return await this.safeLocalStorageSet(dataToSet)
  }

  async setOption (optionName, value) {
    var valuesToSet = {}
    valuesToSet[optionName] = value
    return await this.setOptions(valuesToSet)
  }

  async setGlobalOption (optionName, value) {
    if (this.dataSetPending) {
      throw new Error(
        `Attempted to call OptionsManager.setGlobalOption() while data set was still pending.
				Due to the way localStorage works, you must wait for the previous set to complete
				before setting again.`
      )
    }

    var localData = await browser.storage.local.get()
    localData[optionName] = value
    return await this.safeLocalStorageSet(localData)
  }

  async setCurrentProfile (id) {
    return await this.safeLocalStorageSet({ profile: id })
  }

  async deleteProfile (id) {
    var profiles = (await browser.storage.local.get('profiles')).profiles
    var newProfiles = profiles.filter(profile => profile.id !== id)
    var currentProfile = await this.getCurrentProfileId()
    var newProfile
    if (currentProfile === id) {
      newProfile = null
    } else {
      newProfile = currentProfile
    }

    var dataToSet = {
      profile: newProfile,
      profiles: newProfiles
    }

    await this.safeLocalStorageSet(dataToSet)

    return await browser.storage.local.remove(id + '/options')
  }

  async createProfile (name) {
    var profiles = await this.getProfiles()
    var maximum = 0
    for (const profile of profiles) {
      if (profile.id > maximum) {
        maximum = profile.id
      }
    }
    var newId = maximum + 1
    var newProfile = { id: newId, name: name }
    profiles.push(newProfile)

    var dataToSet = {}
    dataToSet.profiles = profiles
    dataToSet[newId + '/options'] = OptionsManager.DefaultProfileOptions

    await this.safeLocalStorageSet(dataToSet)
    return newId
  }

  async renameProfile (id, name) {
    var profiles = await this.getProfiles()
    for (const profile of profiles) {
      if (profile.id === id) {
        profile.name = name
      }
    }
    return await this.safeLocalStorageSet({ profiles: profiles })
  }

  async safeLocalStorageSet (dataObject) {
    if (this.dataSetPending) {
      throw new Error(
        `Attempted to call OptionsManager.setOption() while data set was still pending.
				Due to the way localStorage works, you must wait for the previous set to complete
				before setting again.`
      )
    } else {
      this.dataSetPending = true
      return browser.storage.local.set(dataObject).then(() => {
        this.dataSetPending = false
      })
    }
  }

  async safeLocalStorageSetKey (key, value) {
    if (this.dataSetPending) {
      throw new Error(
        `Attempted to call OptionsManager.setOption() while data set was still pending.
				Due to the way localStorage works, you must wait for the previous set to complete
				before setting again.`
      )
    } else {
      this.dataSetPending = true
      return browser.storage.local.set(key, value).then(() => {
        this.dataSetPending = false
      })
    }
  }
}

OptionsManager.PublicGlobalOptions = ['language']

OptionsManager.DefaultProfileOptions = {
  blacklistedPrefixes: [],
  whitelistedSuffixes: [],
  minPrefixLength: 4,
  maxSuffixLength: 4,
  useInflection: true,
  lookupURL: 'https://translate.google.com/#auto/en/$',
  notDefinedColor: '#FF6464',
  definedColor: '#64FF32',
  similarColor: '#6496FF',
  notDefinedOpacity: 35,
  definedOpacity: 35,
  similarOpacity: 35,
  separatorCharacters: ''
}
