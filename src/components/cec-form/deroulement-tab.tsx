"use client";

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { MonitoringTable } from './monitoring-table';
import { Cardioplegia } from './cardioplegia';
import { Timeline } from './timeline';

interface DeroulementTabProps {
    isReadOnly: boolean;
}

export function DeroulementTab({ isReadOnly }: DeroulementTabProps) {
    const { control } = useFormContext();

    return (
        <fieldset disabled={isReadOnly} className="space-y-8 py-4">
            <Timeline />
            <MonitoringTable />
            <Cardioplegia />
        </fieldset>
    );
}
