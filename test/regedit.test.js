// TODO need to find a better way to test the 32bit/64bit specific scenarios

var index = require('../index')
var should = require('should')

describe('regedit', function () {
	describe('list keys and values in a sub key', function () {
		var target = 'HKLM\\software\\microsoft\\windows\\CurrentVersion'

		it(target, function (done) {
			index.list(target, function(err, result) {
				if (err) return done(err)
		
				result.should.have.property(target)

				var key = result[target]
			
				key.should.have.property('keys')
				key.should.have.property('values')
				key.keys.should.containEql('Policies')
				key.values.should.have.property('ProgramFilesDir')
				key.values.ProgramFilesDir.should.have.property('value')
				key.values.ProgramFilesDir.value.indexOf('C:\\Program Files').should.eql(0)
				key.values.ProgramFilesDir.should.have.property('type', 'REG_SZ')
			
				done()
			})
		})

		it(target + ' 32bit', function (done) {
			index.arch.list32(target, function(err, result) {
				if (err) return done(err)
		
				result.should.have.property(target)

				var key = result[target]
			
				key.should.have.property('keys')
				key.should.have.property('values')
				key.keys.should.containEql('Policies')
				key.values.should.have.property('ProgramFilesDir')
				key.values.ProgramFilesDir.should.have.property('value')
				key.values.ProgramFilesDir.value.indexOf('C:\\Program Files').should.eql(0)
				key.values.ProgramFilesDir.should.have.property('type', 'REG_SZ')
			
				done()
			})
		})

		it(target + ' 64bit', function (done) {
			index.arch.list64(target, function(err, result) {
				if (err) return done(err)
		
				result.should.have.property(target)

				var key = result[target]
			
				key.should.have.property('keys')
				key.should.have.property('values')
				key.keys.should.containEql('Policies')
				key.values.should.have.property('ProgramFilesDir')
				key.values.ProgramFilesDir.should.have.property('value', 'C:\\Program Files')
				key.values.ProgramFilesDir.should.have.property('type', 'REG_SZ')
			
				done()
			})
		})

		it(target + ' arch auto pick', function (done) {
			index.arch.list(target, function(err, result) {
				if (err) return done(err)
		
				result.should.have.property(target)

				var key = result[target]
			
				key.should.have.property('keys')
				key.should.have.property('values')
				key.keys.should.containEql('Policies')
				key.values.should.have.property('ProgramFilesDir')
				key.values.ProgramFilesDir.should.have.property('value', 'C:\\Program Files')
				key.values.ProgramFilesDir.should.have.property('type', 'REG_SZ')
			
				done()
			})
		})

		it('can be applied to several independant keys at once', function (done) {
			index.list(['hklm', 'hkcu'], function (err, result) {
				if (err) return done(err)

				result.should.have.property('hklm')
				result.hklm.should.have.property('keys')
				result.hklm.keys.should.containEql('SOFTWARE')

				result.should.have.property('hkcu')
				result.hkcu.should.have.property('keys')
				result.hkcu.keys.should.containEql('Software')

				done()
			})
		})

		it('handle spaces in registry keys', function (done) {
			var key = 'HKCU\\Keyboard Layout'
			
			index.list([key], function(err, result) {
				result[key].should.have.property('keys')
				result[key].keys.should.containEql('Preload')
				result[key].keys.should.containEql('Substitutes')
				result[key].keys.should.containEql('Toggle')
				
				done()
			})
		})

		it('will fail for unknown hives', function(done) {
			index.list('lala\\software', function(err, result) {
				should(err).not.be.null
				err.message.should.eql('unsupported hive')
				done()
			})
		})
	})

	describe('create keys', function () {
		var key = 'HKCU\\software\\ironSource\\regedit\\test\\'
		var now = Date.now().toString()

		it('will throw an error if we dont have permission', function (done) {
			index.createKey('HKLM\\SECURITY\\unauthorized', function(err, result) {
				err.should.be.an.Error
				err.message.should.eql('access is denied')
				done()
			})
		})

		it(key + now, function (done) {
			index.createKey(key + now, function(err) {
				if (err) return done(err)
				
				// testing using the module itself is not the best idea...
				index.list(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)
					done()
				})
			})
		})

		it(key + now + ' S', function (done) {
			index.arch.createKey(key + now, function(err) {
				if (err) return done(err)
				
				// testing using the module itself is not the best idea...
				index.arch.list(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)
					done()
				})
			})
		})

		it(key + now + ' 32bit', function (done) {
			index.arch.createKey32(key + now, function(err) {
				if (err) return done(err)
				
				// testing using the module itself is not the best idea...
				index.arch.list32(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)
					done()
				})
			})
		})

		it(key + now + ' 64bit', function (done) {
			index.arch.createKey64(key + now, function(err) {
				if (err) return done(err)
				
				// testing using the module itself is not the best idea...
				index.arch.list64(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)
					done()
				})
			})
		})

		afterEach(function () {
			now = Date.now().toString()
		})
	})

	describe('delete keys', function () {
		var key = 'HKCU\\software\\ironSource\\regedit\\test\\'
		var now = Date.now().toString()
	
		it('will throw an error if we attempt to delete a key without permission', function (done) {
			index.deleteKey('HKLM\\SECURITY', function(err) {
				err.should.be.an.Error
				err.message.should.eql('access is denied')
				done()
			})
		})

		it(key + now, function (done) {
			index.createKey(key + now, function(err) {
				if (err) return done(err)

				index.list(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)

					index.deleteKey(key + now, function(err) {
						if (err) return done(err)

						index.list(key, function(err, result1) {
							if (err) return done(err)

							result1.should.not.containEql(now)
							done()
						})
					})
				})
			})
		})

		it(key + now + ' S', function (done) {
			index.arch.createKey(key + now, function(err) {
				if (err) return done(err)

				index.arch.list(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)

					index.arch.deleteKey(key + now, function(err) {
						if (err) return done(err)

						index.list(key, function(err, result1) {
							if (err) return done(err)

							result1.should.not.containEql(now)
							done()
						})
					})
				})
			})
		})

		it(key + now + ' 32bit', function (done) {
			index.arch.createKey32(key + now, function(err) {
				if (err) return done(err)

				index.arch.list32(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)

					index.arch.deleteKey32(key + now, function(err) {
						if (err) return done(err)

						index.list(key, function(err, result1) {
							if (err) return done(err)

							result1.should.not.containEql(now)
							done()
						})
					})
				})
			})
		})

		it(key + now + ' 64bit', function (done) {
			index.arch.createKey64(key + now, function(err) {
				if (err) return done(err)

				index.arch.list64(key, function(err, result) {
					if (err) return done(err)

					result[key].keys.should.containEql(now)

					index.arch.deleteKey64(key + now, function(err) {
						if (err) return done(err)

						index.list(key, function(err, result1) {
							if (err) return done(err)

							result1.should.not.containEql(now)
							done()
						})
					})
				})
			})
		})

		afterEach(function () {
			now = Date.now().toString()
		})
	})

	describe('put values', function () {
		var key = 'HKCU\\software\\ironSource\\regedit\\test\\'
		var now = Date.now().toString()
		var map = {}
			
		it('in ' + key + now, function (done) {			
			index.putValue(map, function(err) {
				if (err) return done(err)
				
				index.list(key + now, function(err, result) {					
					if (err) return done(err)
					var values = result[key + now].values

					values.should.have.property('a key')
					values['a key'].type.should.eql('REG_SZ')
					values['a key'].value.should.eql('some string')

					values.should.have.property('b')
					values.b.type.should.eql('REG_BINARY')
					values.b.value.should.eql([1,2,3])
					
					values.should.have.property('c')
					values.c.type.should.eql('REG_DWORD')
					values.c.value.should.eql(10)

					values.should.have.property('d')
					values.d.type.should.eql('REG_QWORD')
					values.d.value.should.eql(100)

					values.should.have.property('e')
					values.e.type.should.eql('REG_EXPAND_SZ')
					values.e.value.should.eql('expand_string')
					
					values.should.have.property('f')
					values.f.type.should.eql('REG_MULTI_SZ')
					values.f.value.should.eql(['a', 'b', 'c'])

					values.should.have.property('测试')
					values['测试'].type.should.eql('REG_SZ')
					values['测试'].value.should.eql('值 test for non-English environment')

					done()
				})
			})		
		})

		it('in ' + key + now +  ' S', function (done) {			
			index.arch.putValue(map, function(err) {
				if (err) return done(err)
				
				index.arch.list(key + now, function(err, result) {					
					if (err) return done(err)
					var values = result[key + now].values

					values.should.have.property('a key')
					values['a key'].type.should.eql('REG_SZ')
					values['a key'].value.should.eql('some string')

					values.should.have.property('b')
					values.b.type.should.eql('REG_BINARY')
					values.b.value.should.eql([1,2,3])
					
					values.should.have.property('c')
					values.c.type.should.eql('REG_DWORD')
					values.c.value.should.eql(10)

					values.should.have.property('d')
					values.d.type.should.eql('REG_QWORD')
					values.d.value.should.eql(100)

					values.should.have.property('e')
					values.e.type.should.eql('REG_EXPAND_SZ')
					values.e.value.should.eql('expand_string')
					
					values.should.have.property('f')
					values.f.type.should.eql('REG_MULTI_SZ')
					values.f.value.should.eql(['a', 'b', 'c'])

					values.should.have.property('测试')
					values['测试'].type.should.eql('REG_SZ')
					values['测试'].value.should.eql('值 test for non-English environment')

					done()
				})
			})		
		})

		it('in ' + key + now + ' 32bit', function (done) {			
			index.arch.putValue32(map, function(err) {
				if (err) return done(err)
				
				index.arch.list32(key + now, function(err, result) {					
					if (err) return done(err)
					var values = result[key + now].values

					values.should.have.property('a key')
					values['a key'].type.should.eql('REG_SZ')
					values['a key'].value.should.eql('some string')

					values.should.have.property('b')
					values.b.type.should.eql('REG_BINARY')
					values.b.value.should.eql([1,2,3])
					
					values.should.have.property('c')
					values.c.type.should.eql('REG_DWORD')
					values.c.value.should.eql(10)

					values.should.have.property('d')
					values.d.type.should.eql('REG_QWORD')
					values.d.value.should.eql(100)

					values.should.have.property('e')
					values.e.type.should.eql('REG_EXPAND_SZ')
					values.e.value.should.eql('expand_string')
					
					values.should.have.property('f')
					values.f.type.should.eql('REG_MULTI_SZ')
					values.f.value.should.eql(['a', 'b', 'c'])

					values.should.have.property('测试')
					values['测试'].type.should.eql('REG_SZ')
					values['测试'].value.should.eql('值 test for non-English environment')

					done()
				})
			})		
		})

		it('in ' + key + now + '64bit', function (done) {			
			index.arch.putValue64(map, function(err) {
				if (err) return done(err)
				
				index.arch.list64(key + now, function(err, result) {					
					if (err) return done(err)
					var values = result[key + now].values

					values.should.have.property('a key')
					values['a key'].type.should.eql('REG_SZ')
					values['a key'].value.should.eql('some string')

					values.should.have.property('b')
					values.b.type.should.eql('REG_BINARY')
					values.b.value.should.eql([1,2,3])
					
					values.should.have.property('c')
					values.c.type.should.eql('REG_DWORD')
					values.c.value.should.eql(10)

					values.should.have.property('d')
					values.d.type.should.eql('REG_QWORD')
					values.d.value.should.eql(100)

					values.should.have.property('e')
					values.e.type.should.eql('REG_EXPAND_SZ')
					values.e.value.should.eql('expand_string')
					
					values.should.have.property('f')
					values.f.type.should.eql('REG_MULTI_SZ')
					values.f.value.should.eql(['a', 'b', 'c'])

					values.should.have.property('测试')
					values['测试'].type.should.eql('REG_SZ')
					values['测试'].value.should.eql('值 test for non-English environment')

					done()
				})
			})		
		})

		beforeEach(function (done) {			
			index.createKey(key + now, done)
			map[key + now] = {
				'a key': {
					type: 'reg_sz',
					value: 'some string'
				},

				'b': {
					type: 'reg_binary',
					value: [1, 2, 3]
				},

				'c': {
					type: 'reg_dword',
					value: 10
				},

				'd': {
					type: 'reg_qword',
					value: 100
				},

				'e': {
					type: 'reg_expand_sz',
					value: 'expand_string'
				},

				'f': {
					type: 'reg_multi_sz',
					value: ['a', 'b', 'c']
				},

				'测试': {
					type: 'reg_sz',
					value: '值 test for non-English environment'
				}
			}
		})

		afterEach(function () {
			now = Date.now().toString()
		})
	})
})
