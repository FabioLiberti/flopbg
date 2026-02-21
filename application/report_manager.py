# ..application/report_manager.py

import os
import logging
import threading
import schedule
import time
from datetime import datetime
import json
import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class ReportGenerator(ABC):
    def __init__(self, report_name: str, schedule_time: str):
        self.report_name = report_name
        self.schedule_time = schedule_time
        self.execution_dir = None
        self.monitoring_data = {}

    @abstractmethod
    def generate(self) -> str:
        """Genera il report e restituisce il percorso dove è stato salvato"""
        pass

    def set_execution_dir(self, execution_dir: str):
        """Imposta la directory di esecuzione per il report"""
        self.execution_dir = execution_dir

    def update_monitoring_data(self, data: Dict[str, Any]):
        """Aggiorna i dati di monitoraggio per il report"""
        self.monitoring_data.update(data)

class ReportManager:
    def __init__(self):
        self.reports = {}
        self._scheduler_thread = None
        self._stop_scheduler = False
        self.execution_dir = None
        self.monitoring_data = {}

    def register_report(self, report: ReportGenerator):
        """Registra un nuovo report"""
        self.reports[report.report_name] = report
        if self.execution_dir:
            report.set_execution_dir(self.execution_dir)
        logging.info(f"Report registrato: {report.report_name}")

    def configure_monitoring(self, execution_dir: str, **monitoring_data):
        """Configura il monitoraggio e la directory di esecuzione"""
        self.execution_dir = execution_dir
        self.monitoring_data = monitoring_data
        
        # Aggiorna tutti i report registrati
        for report in self.reports.values():
            report.set_execution_dir(execution_dir)
            report.update_monitoring_data(monitoring_data)

    def update_monitoring_data(self, data: Dict[str, Any]):
        """Aggiorna i dati di monitoraggio"""
        self.monitoring_data.update(data)
        for report in self.reports.values():
            report.update_monitoring_data(data)

    def generate_report(self, report_name: str) -> Optional[str]:
        """Genera un report specifico"""
        try:
            if report_name not in self.reports:
                raise ValueError(f"Report {report_name} non trovato")
                
            report = self.reports[report_name]
            output_path = report.generate()
            
            logging.info(f"Report {report_name} generato: {output_path}")
            return output_path
            
        except Exception as e:
            logging.error(f"Errore nella generazione del report {report_name}: {str(e)}")
            return None

    def generate_all_reports(self) -> Dict[str, str]:
        """Genera tutti i report registrati"""
        results = {}
        for report_name in self.reports:
            output_path = self.generate_report(report_name)
            if output_path:
                results[report_name] = output_path
        return results

    def start_scheduler(self):
        """Avvia lo scheduler per la generazione automatica dei report"""
        if self._scheduler_thread is not None:
            return
            
        def run_scheduler():
            while not self._stop_scheduler:
                schedule.run_pending()
                time.sleep(60)

        # Pianifica i report
        for report in self.reports.values():
            schedule.every().day.at(report.schedule_time).do(
                self.generate_report, report.report_name
            )

        self._stop_scheduler = False
        self._scheduler_thread = threading.Thread(target=run_scheduler)
        self._scheduler_thread.daemon = True
        self._scheduler_thread.start()
        logging.info("Scheduler dei report avviato")

    def stop_scheduler(self):
        """Ferma lo scheduler"""
        self._stop_scheduler = True
        if self._scheduler_thread:
            self._scheduler_thread.join()
            self._scheduler_thread = None
        logging.info("Scheduler dei report fermato")

    def save_execution_snapshot(self, snapshot_data: Dict[str, Any]):
        """Salva uno snapshot dell'esecuzione"""
        if not self.execution_dir:
            logging.warning("Directory di esecuzione non configurata")
            return

        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            snapshot_path = os.path.join(
                self.execution_dir, 
                'snapshots', 
                f'snapshot_{timestamp}.json'
            )
            
            os.makedirs(os.path.dirname(snapshot_path), exist_ok=True)
            
            with open(snapshot_path, 'w') as f:
                json.dump(snapshot_data, f, indent=4)
                
            logging.info(f"Snapshot salvato: {snapshot_path}")
            
        except Exception as e:
            logging.error(f"Errore nel salvataggio dello snapshot: {str(e)}")