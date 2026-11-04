import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {FinanceProvider} from './src/data/FinanceProvider';
import {AppNavigation} from './src/navigation/AppNavigation';
import {theme} from './src/theme/theme';

export default function App() {
  return <SafeAreaProvider>
    <PaperProvider theme={theme} settings={{icon: props => <MaterialDesignIcons {...props} name={props.name as React.ComponentProps<typeof MaterialDesignIcons>['name']}/>}}>
      <StatusBar barStyle="dark-content"/>
      <FinanceProvider><AppNavigation/></FinanceProvider>
    </PaperProvider>
  </SafeAreaProvider>;
}
