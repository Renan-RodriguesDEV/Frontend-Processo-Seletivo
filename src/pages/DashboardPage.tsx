import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import {
  fromDatetimeLocal,
  formatDateTime,
  toDatetimeLocal,
} from "../lib/dates";
import { normalizeError } from "../services/api";
import { reservationService } from "../services/reservationService";
import type {
  CreateLocationRequest,
  CreateReservationRequest,
  CreateRoomRequest,
  Location,
  Reservation,
  Room,
  UpdateReservationRequest,
  UpdateRoomRequest,
} from "../types";

type TabKey = "reservations" | "rooms" | "locations";

type ToastState = {
  type: "success" | "error";
  text: string;
} | null;

const emptyLocation = { name: "", address: "" };
const emptyRoom = { name: "", location_id: "", capacity: "" };
const emptyReservation = {
  room_id: "",
  start_datetime: "",
  end_datetime: "",
  responsible: "",
  coffee: false,
  people_count: "",
  description: "",
};

export function DashboardPage() {
  const [tab, setTab] = useState<TabKey>("reservations");
  const [locations, setLocations] = useState<Location[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [reservationForm, setReservationForm] = useState(emptyReservation);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingReservationId, setEditingReservationId] = useState<
    number | null
  >(null);
  const [selectedReservationIds, setSelectedReservationIds] = useState<
    number[]
  >([]);
  const [selectAllDelete, setSelectAllDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    destructive: false,
    onConfirm: undefined as undefined | (() => void),
  });

  const { logout } = useAuth();
  const navigate = useNavigate();

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        id: room.id,
        label: `${room.name} • ${getLocationName(room.location_id, locations)}`,
      })),
    [locations, rooms],
  );

  const selectedReservationsCount = selectedReservationIds.length;

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

    try {
      const [locationList, roomList, reservationList] = await Promise.all([
        reservationService.getLocations(),
        reservationService.getRooms(),
        reservationService.getReservations(),
      ]);

      setLocations(locationList);
      setRooms(roomList);
      setReservations(reservationList);
    } catch (caughtError) {
      showToast("error", normalizeError(caughtError));
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  }

  function openConfirmDialog(config: {
    title: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }) {
    setConfirmState({ open: true, ...config });
  }

  function closeConfirmDialog() {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      confirmLabel: "Confirmar",
      destructive: false,
      onConfirm: undefined,
    });
  }

  async function handleLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await reservationService.createLocation(
        locationForm as CreateLocationRequest,
      );
      setLocationForm(emptyLocation);
      await loadAll();
      showToast("success", "Local criado com sucesso.");
    } catch (caughtError) {
      showToast("error", normalizeError(caughtError));
    } finally {
      setSaving(false);
    }
  }

  function startRoomEdit(room: Room) {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      location_id: String(room.location_id),
      capacity: String(room.capacity),
    });
    setTab("rooms");
  }

  function cancelRoomEdit() {
    setEditingRoomId(null);
    setRoomForm(emptyRoom);
  }

  async function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload: CreateRoomRequest | UpdateRoomRequest = {
        name: roomForm.name,
        location_id: Number(roomForm.location_id),
        capacity: Number(roomForm.capacity),
      };

      if (editingRoomId) {
        await reservationService.updateRoom(editingRoomId, payload);
        showToast("success", "Sala atualizada com sucesso.");
      } else {
        await reservationService.createRoom(payload as CreateRoomRequest);
        showToast("success", "Sala criada com sucesso.");
      }

      cancelRoomEdit();
      await loadAll();
    } catch (caughtError) {
      showToast("error", normalizeError(caughtError));
    } finally {
      setSaving(false);
    }
  }

  function startReservationEdit(reservation: Reservation) {
    setEditingReservationId(reservation.id);
    setReservationForm({
      room_id: String(reservation.room_id),
      start_datetime: toDatetimeLocal(reservation.start_datetime),
      end_datetime: toDatetimeLocal(reservation.end_datetime),
      responsible: reservation.responsible,
      coffee: reservation.coffee,
      people_count: reservation.people_count
        ? String(reservation.people_count)
        : "",
      description: reservation.description ?? "",
    });
    setTab("reservations");
  }

  function cancelReservationEdit() {
    setEditingReservationId(null);
    setReservationForm(emptyReservation);
  }

  async function handleReservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      if (reservationForm.coffee && !reservationForm.people_count) {
        showToast(
          "error",
          "Informe a quantidade de pessoas quando houver café.",
        );
        return;
      }

      const payload: CreateReservationRequest | UpdateReservationRequest = {
        room_id: Number(reservationForm.room_id),
        start_datetime: fromDatetimeLocal(reservationForm.start_datetime),
        end_datetime: fromDatetimeLocal(reservationForm.end_datetime),
        responsible: reservationForm.responsible,
        coffee: reservationForm.coffee,
        people_count: reservationForm.coffee
          ? Number(reservationForm.people_count)
          : undefined,
        description: reservationForm.description || undefined,
      };

      if (editingReservationId) {
        await reservationService.updateReservation(
          editingReservationId,
          payload,
        );
        showToast("success", "Reserva atualizada com sucesso.");
      } else {
        await reservationService.createReservation(
          payload as CreateReservationRequest,
        );
        showToast("success", "Reserva criada com sucesso.");
      }

      cancelReservationEdit();
      await loadAll();
    } catch (caughtError) {
      showToast("error", normalizeError(caughtError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReservation(reservationId: number) {
    openConfirmDialog({
      title: "Excluir reserva?",
      message: "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      destructive: true,
      onConfirm: async () => {
        try {
          await reservationService.deleteReservation(reservationId);
          setSelectedReservationIds((current) =>
            current.filter((id) => id !== reservationId),
          );
          await loadAll();
          showToast("success", "Reserva excluída com sucesso.");
        } catch (caughtError) {
          showToast("error", normalizeError(caughtError));
        }
      },
    });
  }

  async function handleBulkDelete() {
    // If header select-all-delete checkbox is active, delete all reservations
    if (selectAllDelete) {
      if (reservations.length === 0) return;

      openConfirmDialog({
        title: "Excluir todas as reservas?",
        message: `Serão removidas todas as reservas (${reservations.length}).`,
        confirmLabel: "Excluir todas",
        destructive: true,
        onConfirm: async () => {
          try {
            await reservationService.deleteAllReservations();
            setSelectedReservationIds([]);
            setSelectAllDelete(false);
            await loadAll();
            showToast("success", "Todas as reservas foram excluídas.");
          } catch (caughtError) {
            showToast("error", normalizeError(caughtError));
          }
        },
      });
      return;
    }

    if (selectedReservationsCount === 0) {
      return;
    }

    openConfirmDialog({
      title: "Excluir reservas selecionadas?",
      message: `Serão removidas ${selectedReservationsCount} reservas.`,
      confirmLabel: "Excluir selecionadas",
      destructive: true,
      onConfirm: async () => {
        try {
          await reservationService.deleteSelectedReservations(
            selectedReservationIds,
          );
          setSelectedReservationIds([]);
          await loadAll();
          showToast("success", "Reservas selecionadas excluídas com sucesso.");
        } catch (caughtError) {
          showToast("error", normalizeError(caughtError));
        }
      },
    });
  }

  function toggleReservationSelection(reservationId: number) {
    setSelectedReservationIds((current) =>
      current.includes(reservationId)
        ? current.filter((id) => id !== reservationId)
        : [...current, reservationId],
    );
  }

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Banana Ltda.</p>
          <h1>Painel de reservas</h1>
        </div>

        <div className="topbar-actions">
          <button type="button" className="button secondary" onClick={loadAll}>
            Recarregar dados
          </button>
          <button type="button" className="button danger" onClick={signOut}>
            Sair
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article>
          <strong>{locations.length}</strong>
          <span>locais</span>
        </article>
        <article>
          <strong>{rooms.length}</strong>
          <span>salas</span>
        </article>
        <article>
          <strong>{reservations.length}</strong>
          <span>reservas</span>
        </article>
      </section>

      {toast ? (
        <div className={`feedback ${toast.type}`}>{toast.text}</div>
      ) : null}

      <nav className="tab-bar" aria-label="Seções do sistema">
        <button
          type="button"
          className={tab === "reservations" ? "tab active" : "tab"}
          onClick={() => setTab("reservations")}
        >
          Reservas
        </button>
        <button
          type="button"
          className={tab === "rooms" ? "tab active" : "tab"}
          onClick={() => setTab("rooms")}
        >
          Salas
        </button>
        <button
          type="button"
          className={tab === "locations" ? "tab active" : "tab"}
          onClick={() => setTab("locations")}
        >
          Locais
        </button>
      </nav>

      {loading ? (
        <div className="loading-panel">Carregando dados...</div>
      ) : null}

      {!loading && tab === "reservations" ? (
        <section className="content-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Cadastro e edição</p>
                <h2>
                  {editingReservationId ? "Editar reserva" : "Nova reserva"}
                </h2>
              </div>
              {editingReservationId ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={cancelReservationEdit}
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>

            <form className="form-grid" onSubmit={handleReservationSubmit}>
              <label>
                <span>Sala</span>
                <select
                  value={reservationForm.room_id}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      room_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Selecione</option>
                  {roomOptions.map((roomOption) => (
                    <option key={roomOption.id} value={roomOption.id}>
                      {roomOption.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="two-columns">
                <label>
                  <span>Início</span>
                  <input
                    type="datetime-local"
                    value={reservationForm.start_datetime}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        start_datetime: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  <span>Fim</span>
                  <input
                    type="datetime-local"
                    value={reservationForm.end_datetime}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        end_datetime: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label>
                <span>Responsável</span>
                <input
                  type="text"
                  value={reservationForm.responsible}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      responsible: event.target.value,
                    }))
                  }
                  placeholder="Nome de quem reservou"
                  required
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={reservationForm.coffee}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      coffee: event.target.checked,
                    }))
                  }
                />
                <span>Terá café?</span>
              </label>

              {reservationForm.coffee ? (
                <label>
                  <span>Quantidade de pessoas com café</span>
                  <input
                    type="number"
                    min="1"
                    value={reservationForm.people_count}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        people_count: event.target.value,
                      }))
                    }
                    placeholder="Ex.: 6"
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>Descrição</span>
                <textarea
                  value={reservationForm.description}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Observações opcionais"
                />
              </label>

              <button
                type="submit"
                className="button primary full-width"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editingReservationId
                    ? "Atualizar reserva"
                    : "Criar reserva"}
              </button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Listagem</p>
                <h2>Reservas</h2>
              </div>
              <button
                type="button"
                className="button danger"
                onClick={handleBulkDelete}
                disabled={selectedReservationsCount === 0 && !selectAllDelete}
              >
                {selectAllDelete
                  ? `Excluir todas (${reservations.length})`
                  : `Excluir selecionadas (${selectedReservationsCount})`}
              </button>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Marcar para exclusão de todas as reservas"
                        checked={selectAllDelete}
                        onChange={(e) => setSelectAllDelete(e.target.checked)}
                      />
                    </th>
                    <th>Sala</th>
                    <th>Local</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Responsável</th>
                    <th>Café</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedReservationIds.includes(
                            reservation.id,
                          )}
                          onChange={() =>
                            toggleReservationSelection(reservation.id)
                          }
                        />
                      </td>
                      <td>
                        {reservation.room?.name ??
                          `Sala ${reservation.room_id}`}
                      </td>
                      <td>
                        {reservation.room?.location?.name ??
                          getLocationName(
                            reservation.room?.location_id ?? 0,
                            locations,
                          )}
                      </td>
                      <td>{formatDateTime(reservation.start_datetime)}</td>
                      <td>{formatDateTime(reservation.end_datetime)}</td>
                      <td>{reservation.responsible}</td>
                      <td>
                        {reservation.coffee
                          ? `Sim${reservation.people_count ? ` (${reservation.people_count})` : ""}`
                          : "Não"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => startReservationEdit(reservation)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              void handleDeleteReservation(reservation.id)
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : null}

      {!loading && tab === "rooms" ? (
        <section className="content-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Cadastro e edição</p>
                <h2>{editingRoomId ? "Editar sala" : "Nova sala"}</h2>
              </div>
              {editingRoomId ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={cancelRoomEdit}
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>

            <form className="form-grid" onSubmit={handleRoomSubmit}>
              <label>
                <span>Nome da sala</span>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Sala Aurora"
                  required
                />
              </label>

              <label>
                <span>Local</span>
                <select
                  value={roomForm.location_id}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      location_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Selecione</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Capacidade</span>
                <input
                  type="number"
                  min="1"
                  value={roomForm.capacity}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                  placeholder="12"
                  required
                />
              </label>

              <button
                type="submit"
                className="button primary full-width"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editingRoomId
                    ? "Atualizar sala"
                    : "Criar sala"}
              </button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Listagem</p>
                <h2>Salas</h2>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Local</th>
                    <th>Capacidade</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.name}</td>
                      <td>
                        {room.location?.name ??
                          getLocationName(room.location_id, locations)}
                      </td>
                      <td>{room.capacity}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => startRoomEdit(room)}
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : null}

      {!loading && tab === "locations" ? (
        <section className="content-grid single-column">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Cadastro</p>
                <h2>Novo local</h2>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleLocationSubmit}>
              <label>
                <span>Nome do local</span>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Matriz Centro"
                  required
                />
              </label>

              <label>
                <span>Endereço</span>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="Rua Exemplo, 123"
                  required
                />
              </label>

              <button
                type="submit"
                className="button primary full-width"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Criar local"}
              </button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Listagem</p>
                <h2>Locais</h2>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td>{location.name}</td>
                      <td>{location.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          const action = confirmState.onConfirm;
          closeConfirmDialog();
          if (action) {
            void action();
          }
        }}
      />
    </main>
  );
}

export default DashboardPage;

function getLocationName(locationId: number, locations: Location[]) {
  return (
    locations.find((location) => location.id === locationId)?.name ??
    `Local ${locationId}`
  );
}
