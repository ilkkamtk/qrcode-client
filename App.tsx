import { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import socket from './utils/socket';
import { Button, Card, Header, Text } from '@rneui/base';
const myId = 'abcde';

const App = () => {
  const [location, setLocation] = useState<null | Location.LocationObject>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [found, setFound] = useState(false);
  const [validated, setValidated] = useState(false);
  const [message, setMessage] = useState('Scan QR code to validate');

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    if (!found || !location) {
      return;
    }
    const data = {
      id: myId,
      location: {
        type: 'Point',
        coordinates: [location.coords.longitude, location.coords.latitude],
      },
    };
    socket.emit('update', data);
  }, [found]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    const json = JSON.parse(data);
    console.log(json);
    if (json.courseName) {
      setCourseName(json.courseName);
    }
    if (json.ids.includes(myId)) {
      console.log('found my id');
      setFound(true);
    } else if (found) {
      console.log('validated');
      setValidated(true);
      setScanned(true);
      setMessage('User Validated');
    } else {
      console.log('not found');
      setMessage('User not found. Scan QR code to validate');
      setScanned(true);
    }
    return;
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {!scanned && location ? (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <>
            <Header
              centerComponent={{ text: 'Scan Code', style: styles.heading }}
            ></Header>
            <Card>
              <Card.Title h1>{courseName}</Card.Title>
              <Card.Title h2>
                {errorMsg || (scanned && !location && 'Getting location')}
              </Card.Title>
              {location && (
                <>
                  <Card.Divider />
                  <Text h3>{message}</Text>
                  <Card.Divider />
                  {!validated && (
                    <Button
                      size="lg"
                      title={'Tap to Scan'}
                      onPress={() => setScanned(false)}
                    />
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default App;
