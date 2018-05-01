// import IndexerWorker from '@/indexer.worker'
import db from '@/library.db'
// import { cacheAlbumArt, cacheColors } from '@/lazy-loaders'
import Queue from 'queue'
import { promiseFiles } from 'node-dir'
import { parseFile } from 'music-metadata'
import { posix, pathSep } from 'path'
import * as mime from 'mime'
import { toDataURI, getColors } from '@/lazy-loaders'
import store from '@/store'
export function removeFiles (libPath) {
  let r = new RegExp('^' + libPath)
  return db.remove({ filePath: r }, { multi: true })
}
export function getMetadata (file) {
  return parseFile(file, {native: true, duration: true})
}
export function indexFile (file) {
  return getMetadata(file)
    .then(metadata => {
      let libraryItem = {}
      libraryItem.filePath = file
      libraryItem.fileName = posix.basename(file)
      libraryItem.title = ''
      libraryItem.artist = ''
      libraryItem.artists = []
      libraryItem.albumArt = ''
      libraryItem.album = ''
      libraryItem.duration = metadata.format.duration
      libraryItem.folderBasedAlbum = false
      libraryItem.title = metadata.common.title || ''
      libraryItem.artist = metadata.common.artist || ''
      libraryItem.artists = metadata.common.artists || []
      libraryItem.album = metadata.common.album || ''
      if (!libraryItem.album) {
        let sections = file.split(pathSep)
        libraryItem.album = sections[sections.length - 2]
        libraryItem.folderBasedAlbum = true
      }
      let picture = metadata.common.picture && metadata.common.picture[0]
      let res = Promise.resolve()
      if (picture) {
        let image = toDataURI(picture.format, picture.data)
        res
          .then(() => getColors(image))
          .then(colors => {
            libraryItem.colors = colors
          })
          .catch((e) => {
            console.log('Error getting colors for', file)
            libraryItem.colors = {}
          })
      }
      res.then(() => db.update({filePath: file}, libraryItem, {upsert: true}))
      return res
    })
}
export function addFiles (path) {
  return new Promise((resolve, reject) => {
    store.commit('BEGIN_INDEXING')
    let indexDetails = {
      processed: 0,
      total: 0
    }
    let indexQueue = new Queue()
    indexQueue.concurrency = 16
    indexQueue.autostart = true
    let finish = () => {
      indexDetails.processed = 0
      indexDetails.total = 0

      store.commit('FINISH_INDEXING')
      resolve()
    }
    indexQueue.on('end', finish)
    indexQueue.on('success', (_, job) => {
      console.log('done with job', _)
    })
    promiseFiles(path)
      .then((files) => files.filter(file => mime.getType(file) && mime.getType(file).startsWith('audio')))
      .then((files) => {
        indexDetails.total = files.length
        if (files.length === 0) {
          finish()
        }
        files.forEach(file => {
          indexQueue.push(cb => {
            return db.count({filePath: file})
              .then((amount) => {
                if (amount === 0) {
                  return indexFile(file)
                    .then(() => {
                      indexDetails.processed++
                      // console.log(indexDetails)
                      store.commit('UPDATE_INDEXING_PROGRESS', indexDetails)
                      cb()
                    })
                } else {
                  cb()
                }
              })
          })
        })
      }).catch((e) => console.warn(e))
  })
}
export default function index (path) {
  return new Promise((resolve, reject) => {
    store.commit('BEGIN_INDEXING')
    let indexDetails = {
      processed: 0,
      total: 0
    }
    let indexQueue = new Queue()
    indexQueue.concurrency = 16
    indexQueue.autostart = true
    let finish = () => {
      indexDetails.processed = 0
      indexDetails.total = 0

      store.commit('FINISH_INDEXING')
      resolve()
    }
    indexQueue.on('end', finish)
    promiseFiles(path)
      .then((files) => files.filter(file => mime.getType(file) && mime.getType(file).startsWith('audio')))
      .then((files) => {
        indexDetails.total = files.length
        if (files.length === 0) {
          finish()
        }
        files.forEach(file => {
          indexQueue.push(cb => {
            return indexFile(file)
              .then(() => {
                indexDetails.processed++
                // console.log(indexDetails)
                store.commit('UPDATE_INDEXING_PROGRESS', indexDetails)
                cb()
              })
          })
        })
      }).catch((e) => console.warn(e))
  })
}
